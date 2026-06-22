using UrbanNest.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly DataBase database;
        private readonly IEmail iemail;
        private readonly IOrder iorder;

        public OrderController(DataBase database, IEmail iemail, IOrder iorder)
        {
            this.database = database;
            this.iemail = iemail;
            this.iorder = iorder;
        }

        [HttpPost]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var cartItems = await database.cartItems
                .Include(c => c.Product)
                .Include(c => c.Cart)
                .Where(c => c.Cart.UserId == userId &&
                            request.SelectedProductIds.Contains(c.ProductId))
                .ToListAsync();

            var address = await database.UserAddress.FirstOrDefaultAsync(a => a.AddressId == request.AddressId && a.UserId == userId);


            if (address == null)
                return BadRequest(new { message = "Please select an address" });

            if (!cartItems.Any())
                return BadRequest("No items selected");

            foreach (var item in cartItems)
            {
                if (item.Product == null || item.Product.stock < item.Quantity)
                    return BadRequest($"{item.Product?.productName} is out of stock");
            }

            using var transaction = await database.Database.BeginTransactionAsync();

            try
            {

                var order = new Orders
                {
                    UsersId = userId,
                    OrderDate = DateTime.UtcNow,
                    AddressId = request.AddressId,
                    Status = "Pending"
                };

                database.orders.Add(order);
                await database.SaveChangesAsync();

                foreach (var item in cartItems)
                {
                    database.orderItems.Add(new OrderItem
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        RetailerId = item.Product.RetailerId,
                        Quantity = item.Quantity,
                        Price = item.Product.productPrice,
                        Status = "Pending"
                    });

                    item.Product.stock -= item.Quantity;
                }

                database.cartItems.RemoveRange(cartItems);

                await database.SaveChangesAsync();

                await transaction.CommitAsync();

                byte[] pdfBytes;

                try
                {
                    pdfBytes = await iorder.GenerateInvoicePdf(order.OrderId);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, ex.Message);  // ⭐ important change
                }

                if (pdfBytes == null || pdfBytes.Length == 0)
                    return StatusCode(500, "PDF generation failed");

                var user = await database.Users.FirstAsync(u => u.UserId == userId);

                try
                {
                    await iemail.SendInvoiceEmail(user.userEmail, pdfBytes);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, "Email failed: " + ex.Message);
                }

                return Ok(new
                {
                    message = "Order placed successfully",
                    orderId = order.OrderId
                });
            }
            catch (Exception ex)
            {
                try
                {
                    await transaction.RollbackAsync();
                }
                catch { }

                return StatusCode(500, "Order failed: " + ex.Message + "| Inner: " + ex.InnerException?.Message);
            }
        }


        [HttpGet]
        public async Task<IActionResult> GetRetailerOrders()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            int retailerId = retailer.RetailerId;

            var orders = await database.orderItems
                .Include(o => o.Product)
                .Include(o => o.Order)
                .Where(o => o.RetailerId == retailerId)
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
                        // ✅ CATEGORY FIX
                        CategoryName = o.Product.Category.CategoryName
                    })
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserOrders()
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value
            );

            var orders = await database.orders
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

            return Ok(orders);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, string status)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest(new { message = "Retailer not found" });

            var order = await database.orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                return NotFound(new { message = "Order not found" });

            // ✅ Check this order belongs to this retailer
            bool isRetailerOrder = order.OrderItems
                .Any(oi => oi.RetailerId == retailer.RetailerId);

            if (!isRetailerOrder)
                return Forbid();

            // ✅ MAIN FIX: once cancelled by user, retailer cannot update
            if (order.Status == "Cancelled by User")
            {
                return BadRequest(new
                {
                    message = "This order was cancelled by user and cannot be updated."
                });
            }

            // ✅ Delivered ke baad bhi change mat hone do
            if (order.Status == "Delivered")
            {
                return BadRequest(new
                {
                    message = "Delivered order cannot be updated."
                });
            }

            // ✅ Allowed statuses only
            var allowedStatuses = new List<string>{
                            "Pending",
                            "Confirmed",
                            "Shipped",
                            "Out for Delivery",
                            "Delivered"
            };

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new { message = "Invalid order status" });
            }

            order.Status = status;

            await database.SaveChangesAsync();

            return Ok(new { message = "Status updated" });
        }

        [HttpPut]
        public async Task<IActionResult> CancelOrder(int orderId)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var order = await database.orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UsersId == userId);

            if (order == null)
                return NotFound(new { message = "Order not found" });

            if (order.Status == "Shipped" ||
                order.Status == "Out for Delivery" ||
                order.Status == "Delivered")
            {
                return BadRequest(new { message = "Order cannot be cancelled now" });
            }

            if (order.Status == "Cancelled by User")
                return BadRequest(new { message = "Order already cancelled" });

            order.Status = "Cancelled by User";

            foreach (var item in order.OrderItems)
            {
                if (item.Product != null)
                {
                    item.Product.stock += item.Quantity;
                }
            }

            await database.SaveChangesAsync();

            return Ok(new { message = "Order cancelled by user" });
        }

    }

}