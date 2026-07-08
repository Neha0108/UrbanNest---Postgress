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

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://api.x.ai/v1/chat/completions");

            request.Headers.Authorization =
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

            request.Content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request);
            var result = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception(
                    $"Grok API error. Status:{response.StatusCode}\n\n{result}");
            }

            using var doc = JsonDocument.Parse(result);

            var choices = doc.RootElement.GetProperty("choices");

            if (choices.GetArrayLength() == 0)
            {
                throw new Exception("Grok API returned no choices.");
            }

            var content = choices[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return content ?? string.Empty;
        }
    }
}