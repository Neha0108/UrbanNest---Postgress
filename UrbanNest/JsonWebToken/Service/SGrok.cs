using System.Text;
using System.Text.Json;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SGrok : IGrok
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public SGrok(
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> AskAsync(string prompt)
        {
            var apiKey = _configuration["Grok:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new Exception("Grok API Key not found.");
            }

            _httpClient.DefaultRequestHeaders.Clear();

            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue(
                    "Bearer",
                    apiKey);

            var body = new
            {
                model = "grok-4",
                messages = new[]
                {
            new
            {
                role = "user",
                content = prompt
            }
        }
            };

            var json = JsonSerializer.Serialize(body);

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://api.x.ai/v1/chat/completions");

            request.Content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request);

            var result = await response.Content.ReadAsStringAsync();

            throw new Exception(
                $"Status:{response.StatusCode}\n\n{result}");
        }
    }
}