using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;

namespace WeeklyPlanner.Infrastructure.Services;

/// <summary>
/// Handles all backlog item CRUD operations.
/// Soft-delete preserves history — rows are never physically deleted.
/// </summary>
public class BacklogService : IBacklogService
{
    private readonly AppDbContext _db;
    public BacklogService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<BacklogItem>> GetAllAsync() =>
        await _db.BacklogItems.Where(b => b.IsActive).OrderBy(b => b.Category).ToListAsync();

    public async Task<BacklogItem?> GetByIdAsync(int id) =>
        await _db.BacklogItems.FindAsync(id);

    public async Task<BacklogItem> CreateAsync(BacklogItem item)
    {
        _db.BacklogItems.Add(item);
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<BacklogItem> UpdateAsync(BacklogItem item)
    {
        _db.BacklogItems.Update(item);
        await _db.SaveChangesAsync();
        return item;
    }

    /// <summary>
    /// Soft-delete: sets IsActive = false.
    /// The row stays in the database so plan history is preserved.
    /// </summary>
    public async Task DeleteAsync(int id)
    {
        var item = await _db.BacklogItems.FindAsync(id);
        if (item is null) return;
        item.IsActive = false;
        await _db.SaveChangesAsync();
    }
}