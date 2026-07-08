using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SChatbot : IChatbot
    {
        private readonly DataBase database;
        private readonly IProduct product;
        private readonly ICart cart;
        private readonly IWishlist wishlist;

        private static readonly string[] DefaultQuickReplies =
            { "Track Order", "Categories", "Show my Cart", "Show my Wishlist", "Help" };

        private static readonly string[] StopWords =
            { "show", "find", "search", "looking", "for", "me", "under", "below",
              "less", "than", "within", "products", "product", "rs", "want", "need", "a", "some", "my" };

        public SChatbot(DataBase db, IProduct product, ICart cart, IWishlist wishlist)
        {
            database = db;
            this.product = product;
            this.cart = cart;
            this.wishlist = wishlist;
        }

        public async Task<ChatResponseDTO> GetReplyAsync(int userId, string message)
        {
            var text = (message ?? string.Empty).ToLowerInvariant().Trim();

            if (string.IsNullOrEmpty(text))
                return Reply("Sorry, I didn't catch that — could you type your question again?");

            if (Regex.IsMatch(text, @"\b(hi|hello|hey|namaste)\b"))
                return Reply("Hi! I can help you find products, check your cart/wishlist, or track an order. What do you need?");

            // ── Specific order lookup ──────────────────────────────
            var numberMatch = Regex.Match(text, @"\d+");
            if (text.Contains("order") && numberMatch.Success)
            {
                int orderId = int.Parse(numberMatch.Value);

                var order = await database.orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UsersId == userId);

                if (order == null)
                    return Reply($"I couldn't find order #{orderId} on your account. Please double-check the order number.");

                var reply = $"Order #{order.OrderId} is currently **{order.Status}**.";
                if (order.Status == "Out for Delivery" && !string.IsNullOrWhiteSpace(order.DeliveryPersonName))
                    reply += $" It's with {order.DeliveryPersonName} ({order.DeliveryPersonPhone}).";

                return Reply(reply);
            }

            // ── General order status ───────────────────────────────
            if (text.Contains("order status") || text.Contains("track") || text.Contains("my order"))
            {
                var recentOrders = await database.orders
                    .Where(o => o.UsersId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Take(3)
                    .Select(o => new { o.OrderId, o.Status })
                    .ToListAsync();

                if (!recentOrders.Any())
                    return Reply("You don't have any orders yet. Once you place one, I can track it for you here!");

                var lines = recentOrders.Select(o => $"• Order #{o.OrderId} — {o.Status}");
                return Reply("Here are your recent orders:\n" + string.Join("\n", lines) +
                             "\n\nAsk me about a specific order number for more detail.");
            }

            // ── Cart ────────────────────────────────────────────────
            if (text.Contains("cart"))
            {
                var items = await cart.get(userId);
                if (items == null || !items.Any())
                    return Reply("Your cart is empty. Want me to show you some products?");

                double total = items.Sum(i => i.ProductPrice * i.Quantity);
                var lines = items.Select(i => $"• {i.ProductName} × {i.Quantity} — ₹{i.ProductPrice * i.Quantity}");
                return Reply($"Here's what's in your cart:\n{string.Join("\n", lines)}\n\nTotal: ₹{total}");
            }

            // ── Wishlist ────────────────────────────────────────────
            if (text.Contains("wishlist"))
            {
                var items = await wishlist.GetWishlist(userId);
                if (items == null || !items.Any())
                    return Reply("Your wishlist is empty. Want me to show you some products?");

                var lines = items.Select(i => $"• {i.ProductName} — ₹{i.ProductPrice}");
                return Reply($"Here's your wishlist:\n{string.Join("\n", lines)}");
            }

            // ── Cancellation / Returns / Delivery / Payment (unchanged from before) ──
            if (text.Contains("cancel"))
                return Reply("You can cancel an order from your Orders page as long as it's still Pending or Confirmed. Once it's Shipped, cancellation isn't available.");

            if (text.Contains("return") || text.Contains("refund"))
                return Reply("You can request a return within 7 days of delivery from your Orders page. Refunds take 5-7 business days after we receive the item.");

            if (text.Contains("delivery time") || text.Contains("shipping") || text.Contains("how long"))
                return Reply("Delivery time depends on your location and the retailer, and shows at checkout. You'll get a live status update here once it ships.");

            if (text.Contains("payment") || text.Contains("razorpay") || text.Contains("pay"))
                return Reply("We accept cards, UPI, netbanking, and wallets via Razorpay — all payments are encrypted and processed securely.");

            if (text.Contains("contact") || text.Contains("support") || text.Contains("human"))
                return Reply("For anything I can't help with, check the Help Center in the footer, or email us — we usually reply within 24 hours.");

            // ── Product search (fallback path — catches "show", "find", category names, "under X") ──
            var priceMatch = Regex.Match(text, @"(?:under|below|less than|within)\s*(?:rs\.?|₹)?\s*(\d+)");
            double? maxPrice = priceMatch.Success ? double.Parse(priceMatch.Groups[1].Value) : (double?)null;

            var keywords = Regex.Replace(text, @"[₹,?!.]", " ")
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(w => !StopWords.Contains(w) && !Regex.IsMatch(w, @"^\d+$"))
                .ToList();

            bool looksLikeSearch = Regex.IsMatch(text, @"\b(show|find|search|looking for|category|categories)\b")
                                   || maxPrice.HasValue || keywords.Any();

            if (looksLikeSearch)
            {
                var allProducts = await product.getAll();

                var matches = allProducts.Where(p =>
                        (!maxPrice.HasValue || p.productPrice <= maxPrice.Value) &&
                        (keywords.Count == 0 || keywords.Any(k =>
                            p.categoryName.ToLower().Contains(k) ||
                            p.subCategoryName.ToLower().Contains(k) ||
                            p.productName.ToLower().Contains(k)))
                    )
                    .Take(6)
                    .ToList();

                if (!matches.Any())
                    return Reply("I couldn't find any products matching that. Try a different keyword or price range.");

                var cards = matches.Select(p => new ChatProductCardDTO
                {
                    ProductId = p.productId,
                    ProductName = p.productName,
                    ProductPrice = p.productPrice,
                    ImagePath = p.imagepath,
                    Stock = p.stock,
                    CategoryName = p.categoryName
                }).ToList();

                return new ChatResponseDTO
                {
                    Reply = $"Here's what I found ({cards.Count} result{(cards.Count == 1 ? "" : "s")}):",
                    Products = cards,
                    QuickReplies = DefaultQuickReplies.ToList()
                };
            }

            return Reply("I'm not sure about that one yet. Try asking about products, your cart, wishlist, or an order.");
        }

        private ChatResponseDTO Reply(string text) => new()
        {
            Reply = text,
            QuickReplies = DefaultQuickReplies.ToList()
        };
    }
}