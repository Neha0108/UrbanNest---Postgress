using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SOrder : IOrder
    {
        private readonly DataBase _db;
        private readonly INotification _notif;

        public SOrder(DataBase db, INotification notif)
        {
            _db = db;
            _notif = notif;
        }

        // ── Place Order ───────────────────────────────────────────────────────

        public async Task<(bool success, string message, int orderId)> PlaceOrderAsync(
            int userId, PlaceOrderRequest request)
        {
            var cartItems = await _db.cartItems
                .Include(c => c.Product)
                .Include(c => c.Cart)
                .Where(c => c.Cart.UserId == userId &&
                            request.SelectedProductIds.Contains(c.ProductId))
                .ToListAsync();

            var address = await _db.UserAddress
                .FirstOrDefaultAsync(a => a.AddressId == request.AddressId && a.UserId == userId);

            if (address == null)
                return (false, "Please select an address", 0);

            if (!cartItems.Any())
                return (false, "No items selected", 0);

            foreach (var item in cartItems)
            {
                if (item.Product == null || item.Product.stock < item.Quantity)
                    return (false, $"{item.Product?.productName} is out of stock", 0);
            }

            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var order = new Orders
                {
                    UsersId = userId,
                    OrderDate = DateTime.UtcNow,
                    AddressId = request.AddressId,
                    Status = "Pending"
                };

                _db.orders.Add(order);
                await _db.SaveChangesAsync();

                // Track unique retailers in this order for notifications
                var retailerIds = new HashSet<int>();

                foreach (var item in cartItems)
                {
                    _db.orderItems.Add(new OrderItem
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        RetailerId = item.Product!.RetailerId,
                        Quantity = item.Quantity,
                        Price = item.Product.productPrice,
                        Status = "Pending"
                    });

                    item.Product.stock -= item.Quantity;
                    retailerIds.Add(item.Product.RetailerId);

                    // Low stock alert
                    if (item.Product.stock <= 5)
                    {
                        await _notif.SendToRetailerAsync(
                            retailerId: item.Product.RetailerId,
                            type: NotificationTypes.LowStock,
                            title: "Low Stock Alert ⚠️",
                            message: $"'{item.Product.productName}' has only {item.Product.stock} units left.",
                            productId: item.Product.productId
                        );
                    }
                }

                _db.cartItems.RemoveRange(cartItems);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                // Get consumer record for notification
                var consumer = await _db.consumers
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (consumer != null)
                {
                    await _notif.SendToConsumerAsync(
                        consumerId: consumer.ConsumerId,
                        type: NotificationTypes.OrderPlaced,
                        title: "Order Placed! 🎉",
                        message: $"Your order #{order.OrderId} has been placed successfully.",
                        orderId: order.OrderId
                    );
                }

                // Notify every retailer who has items in this order
                foreach (var retailerId in retailerIds)
                {
                    await _notif.SendToRetailerAsync(
                        retailerId: retailerId,
                        type: NotificationTypes.NewOrderReceived,
                        title: "New Order Received 📦",
                        message: $"You have a new order #{order.OrderId}.",
                        orderId: order.OrderId
                    );
                }

                return (true, "Order placed successfully", order.OrderId);
            }
            catch (Exception ex)
            {
                try { await transaction.RollbackAsync(); } catch { }
                return (false, $"Order failed: {ex.Message} | Inner: {ex.InnerException?.Message}", 0);
            }
        }

        // ── Get Retailer Orders ───────────────────────────────────────────────

        public async Task<object?> GetRetailerOrdersAsync(int userId)
        {
            var retailer = await _db.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null) return null;

            var orders = await _db.orderItems
                .Include(o => o.Product)
                .Include(o => o.Order)
                .Where(o => o.RetailerId == retailer.RetailerId)
                .GroupBy(o => o.Order)
                .Select(group => new
                {
                    OrderId = group.Key.OrderId,
                    OrderDate = group.Key.OrderDate,
                    Status = group.Key.Status,
                    CustomerName = group.Key.User.userName,
                    CustomerEmail = group.Key.User.userEmail,
                    Items = group.Select(o => new
                    {
                        ProductId = o.ProductId,
                        ProductName = o.Product.productName,
                        Quantity = o.Quantity,
                        Price = o.Price,
                        Stock = o.Product.stock,
                        CategoryName = o.Product.Category.CategoryName
                    })
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return orders;
        }

        // ── Get User Orders ───────────────────────────────────────────────────

        public async Task<object?> GetUserOrdersAsync(int userId)
        {
            return await _db.orders
                .Where(o => o.UsersId == userId)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.Status,
                    Items = o.OrderItems.Select(oi => new
                    {
                        oi.Product.productName,
                        oi.Quantity,
                        oi.Price
                    })
                })
                .ToListAsync();
        }

        // ── Update Order Status ───────────────────────────────────────────────

        public async Task<(bool success, string message)> UpdateOrderStatusAsync(
            int orderId, string status, int userId)
        {
            var retailer = await _db.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return (false, "Retailer not found");

            var order = await _db.orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                return (false, "Order not found");

            bool isRetailerOrder = order.OrderItems
                .Any(oi => oi.RetailerId == retailer.RetailerId);

            if (!isRetailerOrder)
                return (false, "Forbidden");

            if (order.Status == "Cancelled by User")
                return (false, "This order was cancelled by user and cannot be updated.");

            if (order.Status == "Delivered")
                return (false, "Delivered order cannot be updated.");

            var allowedStatuses = new List<string>
            {
                "Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"
            };

            if (!allowedStatuses.Contains(status))
                return (false, "Invalid order status");

            order.Status = status;
            await _db.SaveChangesAsync();

            // Notify consumer of status change
            var consumer = await _db.consumers
                .FirstOrDefaultAsync(c => c.UserId == order.UsersId);

            if (consumer != null)
            {
                var (type, title, msg) = status switch
                {
                    "Confirmed" => (NotificationTypes.OrderConfirmed, "Order Confirmed ✅", $"Your order #{orderId} has been confirmed."),
                    "Shipped" => (NotificationTypes.OrderShipped, "Order Shipped 🚚", $"Your order #{orderId} is on its way!"),
                    "Out for Delivery" => (NotificationTypes.OutForDelivery, "Out for Delivery 🛵", $"Your order #{orderId} will arrive today."),
                    "Delivered" => (NotificationTypes.OrderDelivered, "Delivered! 📬", $"Your order #{orderId} has been delivered. Enjoy!"),
                    _ => (null, null, null)
                };

                if (type != null)
                {
                    await _notif.SendToConsumerAsync(
                        consumerId: consumer.ConsumerId,
                        type: type,
                        title: title!,
                        message: msg!,
                        orderId: orderId
                    );
                }
            }

            return (true, "Status updated");
        }

        // ── Cancel Order ──────────────────────────────────────────────────────

        public async Task<(bool success, string message)> CancelOrderAsync(int orderId, int userId)
        {
            var order = await _db.orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UsersId == userId);

            if (order == null)
                return (false, "Order not found");

            if (order.Status is "Shipped" or "Out for Delivery" or "Delivered")
                return (false, "Order cannot be cancelled now");

            if (order.Status == "Cancelled by User")
                return (false, "Order already cancelled");

            order.Status = "Cancelled by User";

            foreach (var item in order.OrderItems)
            {
                if (item.Product != null)
                    item.Product.stock += item.Quantity;
            }

            await _db.SaveChangesAsync();

            // Notify consumer
            var consumer = await _db.consumers
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (consumer != null)
            {
                await _notif.SendToConsumerAsync(
                    consumerId: consumer.ConsumerId,
                    type: NotificationTypes.OrderCancelled,
                    title: "Order Cancelled",
                    message: $"Your order #{orderId} has been cancelled.",
                    orderId: orderId
                );
            }

            // Notify each retailer whose items were in the order
            var retailerIds = order.OrderItems
                .Select(oi => oi.RetailerId)
                .Distinct();

            foreach (var retailerId in retailerIds)
            {
                await _notif.SendToRetailerAsync(
                    retailerId: retailerId,
                    type: NotificationTypes.RetailerOrderCancelled,
                    title: "Order Cancelled by Customer",
                    message: $"Order #{orderId} was cancelled by the customer.",
                    orderId: orderId
                );
            }

            return (true, "Order cancelled by user");
        }

        // ── GenerateInvoicePdf — already implemented, keep your existing code ─
        public Task<byte[]> GenerateInvoicePdf(int orderId)
        {
            // Your existing implementation stays here unchanged
            throw new NotImplementedException("Keep your existing GenerateInvoicePdf implementation");
        }
    }
}