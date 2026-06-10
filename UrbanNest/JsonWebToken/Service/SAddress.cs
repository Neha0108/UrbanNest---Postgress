using UrbanNest.DataAccess;
using UrbanNest.Model;
using UrbanNest.Repository;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DTO;

namespace UrbanNest.Service
{
    public class SAddress : IAddress
    {
        private readonly DataBase database;

        public SAddress(DataBase database)
        {
            this.database = database;
        }

        public async Task<UserAddress> AddAddress(UserAddress address, int userId)
        {
            address.UserId = userId;

            if (address.IsDefault)
            {
                var oldAddresses = await database.UserAddress
                    .Where(a => a.UserId == userId)
                    .ToListAsync();

                foreach (var addr in oldAddresses)
                {
                    addr.IsDefault = false;
                }
            }

            database.UserAddress.Add(address);
            await database.SaveChangesAsync();

            return address;
        }

        public async Task<List<UserAddress>> GetUserAddresses(int userId)
        {
            return await database.UserAddress
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ToListAsync();
        }

        public async Task<UserAddress?> GetAddressById(int addressId, int userId)
        {
            return await database.UserAddress
                .FirstOrDefaultAsync(a =>
                    a.AddressId == addressId && a.UserId == userId);
        }

        public async Task<bool> DeleteAddress(int addressId, int userId)
        {
            var address = await database.UserAddress
                .FirstOrDefaultAsync(a =>
                    a.AddressId == addressId && a.UserId == userId);

            if (address == null)
                return false;

            database.UserAddress.Remove(address);
            await database.SaveChangesAsync();

            return true;
        }

        public async Task<UserAddress?> GetDefaultAddress(int userId)
        {
            return await database.UserAddress
                .FirstOrDefaultAsync(a =>
                    a.UserId == userId && a.IsDefault);
        }
    }
}