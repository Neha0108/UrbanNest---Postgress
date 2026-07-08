namespace UrbanNest.Repository
{
    public interface IGrok
    {
        Task<string> AskAsync(string prompt);
    }
}
