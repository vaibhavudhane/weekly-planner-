using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;

namespace WeeklyPlanner.Infrastructure.Services;

/// <summary>
/// Manages week cycles — creation, retrieval, and lead's percentage settings.
/// </summary>
public class WeekCycleService : IWeekCycleService
{
    private readonly AppDbContext _db;
    public WeekCycleService(AppDbContext db) => _db = db;

    public async Task<WeekCycle?> GetCurrentAsync() =>
        await _db.WeekCycles
            .Where(w => w.IsActive)
            .OrderByDescending(w => w.PlanningDate)
            .FirstOrDefaultAsync();

    public async Task<IEnumerable<WeekCycle>> GetAllAsync() =>
        await _db.WeekCycles.OrderByDescending(w => w.PlanningDate).ToListAsync();

    public async Task<WeekCycle> CreateAsync(WeekCycle cycle)
    {
        _db.WeekCycles.Add(cycle);
        await _db.SaveChangesAsync();
        return cycle;
    }

    /// <summary>
    /// Sets the category % split for a given week.
    /// Validates: no negative values, must sum to exactly 100.
    /// </summary>
    public async Task SetPercentagesAsync(int id, decimal cat1, decimal cat2, decimal cat3)
    {
        if (cat1 < 0 || cat2 < 0 || cat3 < 0)
            throw new ArgumentException("Category percentages cannot be negative.");

        if (cat1 + cat2 + cat3 != 100)
            throw new ArgumentException("Category percentages must sum to exactly 100.");

        var cycle = await _db.WeekCycles.FindAsync(id)
            ?? throw new KeyNotFoundException($"WeekCycle {id} not found.");

        cycle.Category1Percent = cat1;
        cycle.Category2Percent = cat2;
        cycle.Category3Percent = cat3;
        await _db.SaveChangesAsync();
    }
}