using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

public class SAdmin : IAdmin
{
    private readonly DataBase database;

    public SAdmin(DataBase database)
    {
        this.database = database;
    }

    public async Task<object> getConsumers()
    {
        return await database.Users
            .Where(u => u.RoleId == 1 || u.RoleId == 4)
            .Select(u => new
            {
                Id = u.UserId,
                Name = u.userName,
                Email = u.userEmail,
                status = u.RoleId == 4 ? "Blocked" : "Active"
            })
            .ToListAsync();
    }

    public async Task<object> getRetailers()
    {
        return await (from u in database.Users
                      join r in database.retailers
                      on u.UserId equals r.UserId
                      where u.RoleId == 2 || u.RoleId == 4
                      select new
                      {
                          userId = u.UserId,
                          uName = u.userName,
                          uEmail = u.userEmail,
                          shopname = r.ShopName,
                          userPhoneNumber = r.ContactNumber,
                          userAddress = r.Address,
                          userGST = r.GSTNumber,
                          userPAN = r.PANNumber,

                          // ✅ STATUS LOGIC
                          status = u.RoleId == 4 ? "Blocked" : "Active"
                      })
                      .ToListAsync();
    }

    public async Task<string> blockUser(int id)
    {
        var user = database.Users.Find(id);
        if (user == null) return "User not found";

        user.RoleId = 4; // ✅ Blocked role
        await database.SaveChangesAsync();

        return "User Blocked";
    }

    public async Task<object> getCategories()
    {
        return await database.Category.ToListAsync();
    }

    public async Task<object> addCategory(CategoryDTO dto)
    {
        var cat = new Category
        {
            CategoryName = dto.CategoryName
        };

        database.Category.Add(cat);
        await database.SaveChangesAsync();

        return cat;
    }

    public async Task<string> deleteCategory(int id)
    {
        var cat = database.Category.Find(id);
        if (cat == null) return "Not found";

        database.Category.Remove(cat);
        await database.SaveChangesAsync();

        return "Deleted";
    }
}