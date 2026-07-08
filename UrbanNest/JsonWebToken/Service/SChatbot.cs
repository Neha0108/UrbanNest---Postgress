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
        private readonly IGrok grok;

        private static readonly string[] DefaultQuickReplies =
            { "Track Order", "Categories", "Show my Cart", "Show my Wishlist", "Help" };

        public SChatbot(DataBase db, IProduct product, ICart cart, IWishlist wishlist, IGrok grok)
        {
            database = db;
            this.product = product;
            this.cart = cart;
            this.wishlist = wishlist;
            this.grok = grok;
        }

        public async Task<ChatResponseDTO> GetReplyAsync(int userId, string message)
        {
            try
            {
                var products = await product.getAll();
                var wishlistItems = await wishlist.GetWishlist(userId) ?? [];
                var cartItems = await cart.get(userId) ?? [];

                var orders = await database.orders
                    .Where(o => o.UsersId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Take(5)
                    .ToListAsync();

                var prompt = $@"You are Urban Nest shopping assistant.

User Message:
{message}

User Cart:
{string.Join("\n",
        cartItems.Select(c =>
        $"{c.ProductName} | Quantity:{c.Quantity} | Price:{c.ProductPrice}"))}

User Wishlist:
{string.Join("\n",
        wishlistItems.Select(w =>
        $"{w.ProductName} | Price:{w.ProductPrice}"))}

Recent Orders:
{string.Join("\n",
        orders.Select(o =>
        $"Order #{o.OrderId} | Status:{o.Status}"))}

Products Available:
{string.Join("\n",
        products.Take(100).Select(p =>
        $"{p.productName} | Category:{p.categoryName} | Price:{p.productPrice}"))}

Rules:
- Answer as Urban Nest assistant.
- Use cart information when user asks about cart.
- Use wishlist information when user asks about wishlist.
- Use order information when user asks about orders.
- Recommend products from available products.
- Keep answers short and friendly.
";

                var response = await grok.AskAsync(prompt);

                return Reply(response);
            }
            catch (Exception ex)
            {
                return Reply($"AI assistant unavailable. {ex.Message}");
            }
        }

        private ChatResponseDTO Reply(string text) => new()
        {
            Reply = text,
            QuickReplies = DefaultQuickReplies.ToList()
        };
    }
}