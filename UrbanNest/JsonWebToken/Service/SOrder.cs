using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using UrbanNest.DataAccess;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SOrder : IOrder
    {
        private readonly DataBase database;

        public SOrder(DataBase database)
        {
            this.database = database;
        }
        public async Task<byte[]> GenerateInvoicePdf(int orderId)
        {
            var order = await database.orders
                .Include(o => o.Address)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstAsync(o => o.OrderId == orderId);

            var address = order.Address;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(30);

                    page.Header().Row(row =>
                    {
                        row.ConstantItem(100).Image(File.ReadAllBytes("wwwroot/FinalBrand.png")).FitArea();

                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("UrbanNest")
                                .FontSize(24)
                                .Bold()
                                .FontColor("#C9A45C");

                            col.Item().Text("Luxury Living")
                                .FontSize(10)
                                .FontColor(Colors.Grey.Medium);
                        });

                        row.ConstantItem(180).Column(col =>
                        {
                            col.Item().AlignRight().Text("INVOICE")
                                .FontSize(18).Bold();

                            col.Item().AlignRight().Text($"Order ID: {order.OrderId}");
                            col.Item().AlignRight().Text($"Date: {order.OrderDate:dd MMM yyyy}");
                        });
                    });

                    page.Content().PaddingVertical(15).Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Shipping Address").Bold().FontSize(12);

                                c.Item().Text(address?.FullName ?? "Customer");
                                c.Item().Text(address?.AddressLine ?? "Address not available");
                                c.Item().Text($"{address?.City}, {address?.State} - {address?.Pincode}");
                                c.Item().Text($"Phone: {address?.Phone ?? "N/A"}");
                            });

                            row.RelativeItem().Column(c =>
                            {
                                c.Item().AlignRight().Text("Payment").Bold().FontSize(12);
                                c.Item().AlignRight().Text("Mode: Online");
                                c.Item().AlignRight().Text("Status: Paid");
                            });
                        });

                        col.Item().PaddingVertical(10).LineHorizontal(1).LineColor("#C9A45C");

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(4);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#C9A45C").Padding(5)
                                    .Text("Product").Bold().FontColor(Colors.White);

                                header.Cell().Background("#C9A45C").Padding(5)
                                    .AlignCenter().Text("Qty").Bold().FontColor(Colors.White);

                                header.Cell().Background("#C9A45C").Padding(5)
                                    .AlignRight().Text("Price").Bold().FontColor(Colors.White);

                                header.Cell().Background("#C9A45C").Padding(5)
                                    .AlignRight().Text("Total").Bold().FontColor(Colors.White);
                            });

                            double subtotal = 0;

                            foreach (var item in order.OrderItems)
                            {
                                var name = item.Product?.productName ?? "Product";
                                double total = item.Price * item.Quantity;
                                subtotal += total;

                                table.Cell().Padding(5).Text(name);
                                table.Cell().Padding(5).AlignCenter().Text(item.Quantity.ToString());
                                table.Cell().Padding(5).AlignRight().Text($"Rs {item.Price}");
                                table.Cell().Padding(5).AlignRight().Text($"Rs {total}");
                            }

                            double gst = subtotal * 0.18;
                            double grandTotal = subtotal + gst;

                            table.Cell().ColumnSpan(3).AlignRight().Text("Subtotal:");
                            table.Cell().AlignRight().Text($"Rs {subtotal}");

                            table.Cell().ColumnSpan(3).AlignRight().Text("GST (18%):");
                            table.Cell().AlignRight().Text($"Rs {gst}");

                            table.Cell().ColumnSpan(3).AlignRight().Text("Grand Total:")
                                .Bold().FontColor("#C9A45C");

                            table.Cell().AlignRight()
                                .Text($"Rs {grandTotal}")
                                .Bold().FontColor("#C9A45C");
                        });

                        col.Item().PaddingTop(15).LineHorizontal(1).LineColor("#C9A45C");

                        col.Item().PaddingTop(10)
                            .AlignCenter()
                            .Text("Thank you for shopping with UrbanNest!")
                            .Italic()
                            .FontSize(10);
                    });

                    page.Footer().AlignCenter().Text(txt =>
                    {
                        txt.Span("UrbanNest • Premium Experience ")
                            .FontSize(9)
                            .FontColor("#C9A45C");
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}