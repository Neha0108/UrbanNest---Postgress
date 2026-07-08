using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanNest.Migrations
{
    /// <inheritdoc />
    public partial class deliverydetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeliveryPersonName",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryPersonPhone",
                table: "orders",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryPersonName",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryPersonPhone",
                table: "orders");
        }
    }
}
