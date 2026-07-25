using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        public int UserId { get; set; }
        public Users User { get; set; } = null!;

        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRevoked { get; set; } = false;

        public string? ReplacedByToken { get; set; }
    }
}