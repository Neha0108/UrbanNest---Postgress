using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SEmail : IEmail
    {
        private readonly IConfiguration _config;
        private readonly DataBase database;
        private readonly HttpClient _httpClient;

        private const string BrevoEndpoint = "https://api.brevo.com/v3/smtp/email";

        public SEmail(IConfiguration config, DataBase database, HttpClient httpClient)
        {
            _config = config;
            this.database = database;
            _httpClient = httpClient;

            // Brevo requires the API key on every request via this header
            _httpClient.DefaultRequestHeaders.Remove("api-key");
            _httpClient.DefaultRequestHeaders.Add("api-key", _config["Brevo:ApiKey"]);
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        private async Task SendViaBrevo(string toEmail, string subject, string htmlContent, (string fileName, byte[] content)? attachment = null)
        {
            var payload = new Dictionary<string, object>
            {
                ["sender"] = new
                {
                    name = _config["SmtpSettings:SenderName"],
                    email = _config["SmtpSettings:SenderEmail"]
                },
                ["to"] = new[]
                {
                    new { email = toEmail }
                },
                ["subject"] = subject,
                ["htmlContent"] = htmlContent
            };

            if (attachment != null)
            {
                payload["attachment"] = new[]
                {
                    new
                    {
                        name = attachment.Value.fileName,
                        content = Convert.ToBase64String(attachment.Value.content)
                    }
                };
            }

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(BrevoEndpoint, content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                // Swallow invoice-email failures like the old code did,
                // but always throw for OTP so the caller knows verification can't proceed
                throw new HttpRequestException($"Brevo email send failed ({(int)response.StatusCode}): {error}");
            }
        }

        public async Task SendOTP(string toEmail, string otp)
        {
            var html = $"<h2>UrbanNest OTP</h2><p>Your OTP is <b>{otp}</b></p>";
            await SendViaBrevo(toEmail, "UrbanNest Email Verification OTP", html);
        }

        public async Task SaveOTP(string email, string otp)
        {
            var otpEntry = new EmailOTP
            {
                Email = email,
                OTP = otp,
                CreatedAt = DateTime.UtcNow,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsVerified = false
            };

            await database.emailOTPs.AddAsync(otpEntry);
            await database.SaveChangesAsync();
        }

        public async Task<bool> VerifyOTP(string email, string otp)
        {
            var record = await database.emailOTPs
                .Where(x => x.Email.ToLower() == email.ToLower()
                         && x.OTP == otp
                         && !x.IsVerified)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (record == null)
                return false;

            if (record.ExpiryTime < DateTime.UtcNow)
                return false;

            record.IsVerified = true;

            await database.SaveChangesAsync();

            return true;
        }

        public async Task<bool> IsEmailVerified(string email)
        {
            return await database.emailOTPs
                .AnyAsync(x => x.Email == email && x.IsVerified);
        }

        public async Task SendInvoiceEmail(string toEmail, byte[] pdfBytes)
        {
            try
            {
                var html = "<h3>Thanks for your order!</h3><p>Your invoice is attached.</p>";
                await SendViaBrevo(toEmail, "Your Order Invoice", html, ("Invoice.pdf", pdfBytes));
            }
            catch
            {
                // optional: log error (kept same behavior as original code)
            }
        }
    }
}