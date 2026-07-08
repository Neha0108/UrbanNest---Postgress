namespace UrbanNest.DTO
{
    public class GrokRequest
    {
        public string model { get; set; } = "";
        public List<Message> messages { get; set; } = new();
    }
    public class Message
    {
        public string role { get; set; } = "";
        public string content { get; set; } = "";
    }
}
