namespace UrbanNest.Repository
{
    public interface IOrder
    {
        Task<byte[]> GenerateInvoicePdf(int orderId);
    }
}
