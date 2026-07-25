using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SUsers : IUser
    {
        private readonly DataBase database;
        private readonly IConfiguration configuration;

        // How long a refresh token stays valid before the user must log in again
        private const int RefreshTokenDays = 7;

        public SUsers(DataBase database, IConfiguration configuration)
        {
            this.database = database;
            this.configuration = configuration;
        }

        public async Task<Register?> register(Register registerRequest)
        {
            bool exists = await database.Users
                .AnyAsync(u => u.userEmail == registerRequest.UserEmail);

            if (exists)
                return null;

            string passwordhashed = BCrypt.Net.BCrypt.HashPassword(registerRequest.UserPassword);

            var role = await database.Role
                .FirstOrDefaultAsync(r => r.Name == registerRequest.Roles);

            if (role == null)
                throw new Exception("Invalid role");

            var user = new Users
            {
                userName = registerRequest.UserName,
                userEmail = registerRequest.UserEmail,
                userPassword = passwordhashed,
                RoleId = role.RoleId,
                Status = "Active"
            };

            await database.Users.AddAsync(user);
            await database.SaveChangesAsync();

            if (role.Name == "Consumer")
            {
                var consumer = new Consumer
                {
                    UserId = user.UserId,
                    FirstName = user.userName
                };

                await database.consumers.AddAsync(consumer);
                await database.SaveChangesAsync();
            }

            if (role.Name == "Retailer")
            {
                if (string.IsNullOrEmpty(registerRequest.shopName) ||
                    string.IsNullOrEmpty(registerRequest.gstNumber) ||
                    string.IsNullOrEmpty(registerRequest.panNumber) ||
                    string.IsNullOrEmpty(registerRequest.contactNumber) ||
                    string.IsNullOrEmpty(registerRequest.address))
                {
                    throw new Exception("Retailer details are required");
                }

                var retailer = new Retailer
                {
                    UserId = user.UserId,
                    ShopName = registerRequest.shopName,
                    GSTNumber = registerRequest.gstNumber,
                    PANNumber = registerRequest.panNumber,
                    ContactNumber = registerRequest.contactNumber,
                    Address = registerRequest.address,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    IsVerified = false
                };

                await database.retailers.AddAsync(retailer);

                await database.SaveChangesAsync();
            }

            return registerRequest;
        }

        public async Task<AuthResponse?> login(Login log)
        {
            var user = await database.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.userEmail == log.UserEmail);

            if (user == null) return null;

            if (user.Status == "Blocked")
            {
                return null;
            }

            bool isValid;
            try
            {
                isValid = BCrypt.Net.BCrypt.Verify(log.UserPassword, user.userPassword);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return null;
            }

            if (!isValid) return null;

            return await IssueTokens(user);
        }

        private async Task<AuthResponse> IssueTokens(Users user)
        {
            var accessToken = IssueAccessToken(user);
            var refreshToken = await GenerateAndStoreRefreshToken(user.UserId);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }

        private string IssueAccessToken(Users user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.userName),
                new Claim(ClaimTypes.Email, user.userEmail),
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(ClaimTypes.Role, user.Role.Name)
            };

            // Kept short on purpose — refresh token handles staying logged in
            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRawToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }

        private async Task<string> GenerateAndStoreRefreshToken(int userId)
        {
            var raw = GenerateRawToken();

            var entry = new RefreshToken
            {
                Token = raw,
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };

            await database.RefreshTokens.AddAsync(entry);
            await database.SaveChangesAsync();

            return raw;
        }

        public async Task<AuthResponse?> RefreshToken(string refreshToken)
        {
            var existing = await database.RefreshTokens
                .Include(r => r.User)
                    .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (existing == null)
                return null;

            // Reuse of an already-rotated or revoked token: treat as compromise,
            // kill every active refresh token for this user as a precaution.
            if (existing.IsRevoked || existing.ExpiresAt < DateTime.UtcNow)
            {
                var allActive = database.RefreshTokens
                    .Where(r => r.UserId == existing.UserId && !r.IsRevoked);

                foreach (var t in allActive)
                    t.IsRevoked = true;

                await database.SaveChangesAsync();
                return null;
            }

            if (existing.User.Status == "Blocked")
                return null;

            // Rotate: revoke the old one, issue a new one
            var newRawToken = GenerateRawToken();

            existing.IsRevoked = true;
            existing.ReplacedByToken = newRawToken;

            var newEntry = new RefreshToken
            {
                Token = newRawToken,
                UserId = existing.UserId,
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };

            await database.RefreshTokens.AddAsync(newEntry);
            await database.SaveChangesAsync();

            var newAccessToken = IssueAccessToken(existing.User);

            return new AuthResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRawToken
            };
        }

        public async Task RevokeRefreshToken(string refreshToken)
        {
            var existing = await database.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (existing != null)
            {
                existing.IsRevoked = true;
                await database.SaveChangesAsync();
            }
        }

        public async Task<string> updateUser(int userId, Register dto)
        {
            var user = await database.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return "User not found";

            user.userName = dto.UserName;
            user.userEmail = dto.UserEmail;

            if (!string.IsNullOrWhiteSpace(dto.UserPassword))
            {
                user.userPassword = BCrypt.Net.BCrypt.HashPassword(dto.UserPassword);
            }

            await database.SaveChangesAsync();
            return "Profile updated successfully";
        }

        public async Task<AuthResponse?> GoogleLogin(string idToken)
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { configuration["Google:ClientId"] }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            var user = await database.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.userEmail == payload.Email);

            if (user != null && user.Status == "Blocked")
            {
                return null;
            }

            if (user == null)
            {
                var consumerRole = await database.Role
                    .FirstOrDefaultAsync(r => r.Name == "Consumer");

                user = new Users
                {
                    userName = payload.Name,
                    userEmail = payload.Email,
                    userPassword = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    RoleId = consumerRole.RoleId
                };

                database.Users.Add(user);
                await database.SaveChangesAsync();

                var consumer = new Consumer
                {
                    UserId = user.UserId,
                    FirstName = payload.Name
                };

                database.consumers.Add(consumer);
                await database.SaveChangesAsync();

                user = await database.Users
                    .Include(x => x.Role)
                    .FirstOrDefaultAsync(x => x.UserId == user.UserId);
            }

            return await IssueTokens(user);
        }

        public async Task<string> changePassword(int id, ChangePassword changePassword)
        {
            var user = await database.Users.FirstOrDefaultAsync(u => u.UserId == id);

            if (user is null) return "User not found";

            if (!BCrypt.Net.BCrypt.Verify(changePassword.oldPassword, user.userPassword))
            {
                return "Old password is incorrect";
            }

            if (changePassword.newPassword != changePassword.confirmPassword)
            {
                return "New password does not match confirm password";
            }

            user.userPassword = BCrypt.Net.BCrypt.HashPassword(changePassword.newPassword);

            await database.SaveChangesAsync();

            return "Password changed successfully";
        }
    }
}