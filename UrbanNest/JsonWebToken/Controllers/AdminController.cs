using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using UrbanNest.Repository;
using UrbanNest.DTO;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdmin admin;
        private readonly ICoupon coupon;

        public AdminController(IAdmin admin, ICoupon coupon)
        {
            this.admin = admin;
            this.coupon = coupon;
        }

        [HttpGet("consumers")]
        public async Task<IActionResult> GetConsumers()
        {
            var data = await admin.getConsumers();
            return Ok(data);
        }

        [HttpGet("retailers")]
        public async Task<IActionResult> GetRetailers()
        {
            var data = await admin.getRetailers();
            return Ok(data);
        }

        [HttpPut("block/{id}")]
        public async Task<IActionResult> BlockUser(int id)
        {
            var message = await admin.blockUser(id);
            return Ok(new { message });
        }

        [HttpPost("addCategory")]
        public async Task<IActionResult> AddCategory([FromBody] CategoryDTO dto)
        {
            var data = await admin.addCategory(dto);
            return Ok(data);
        }

        [HttpGet("getCategories")]
        public async Task<IActionResult> GetCategories()
        {
            var data = await admin.getCategories();
            return Ok(data);
        }

        [HttpDelete("deleteCategory/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var message = await admin.deleteCategory(id);
            return Ok(message);
        }

        // ═══════════════════════════════════════════════════════
        // COUPONS (Admin — global create + full visibility over all coupons)
        // ═══════════════════════════════════════════════════════

        [HttpPost("coupons")]
        public async Task<IActionResult> CreateCoupon([FromBody] CouponCreateDTO dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var result = await coupon.AdminCreateAsync(userId, dto);
            return Ok(result);
        }

        [HttpGet("coupons")]
        public async Task<IActionResult> GetAllCoupons()
        {
            var data = await coupon.AdminGetAllAsync();
            return Ok(data);
        }

        [HttpGet("coupons/{id}")]
        public async Task<IActionResult> GetCouponById(int id)
        {
            var data = await coupon.AdminGetByIdAsync(id);
            if (data == null) return NotFound();
            return Ok(data);
        }

        [HttpPut("coupons/{id}")]
        public async Task<IActionResult> UpdateCoupon(int id, [FromBody] CouponUpdateDTO dto)
        {
            var (success, message) = await coupon.AdminUpdateAsync(id, dto);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [HttpDelete("coupons/{id}")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var (success, message) = await coupon.AdminDeleteAsync(id);
            if (!success) return NotFound(new { message });
            return Ok(new { message });
        }

        [HttpPatch("coupons/{id}/status")]
        public async Task<IActionResult> SetCouponStatus(int id, [FromBody] bool isActive)
        {
            var (success, message) = await coupon.AdminSetStatusAsync(id, isActive);
            if (!success) return NotFound(new { message });
            return Ok(new { message });
        }
    }
}