using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;
using Xunit;

namespace WeeklyPlanner.Tests;

/// <summary>
/// Targeted tests to close the remaining branch/line coverage gaps identified
/// in the coverage report. Add these to your existing service test files or
/// keep as a separate file — both work fine.
/// </summary>
public class CoverageGapTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    // ── WeekCycleService gap: FindAsync returns null → KeyNotFoundException ──

    [Fact]
    public async Task SetPercentages_Throws_WhenWeekCycleIdNotFound()
    {
        // Covers: var cycle = await _db.WeekCycles.FindAsync(id)
        //             ?? throw new KeyNotFoundException(...)  ← this line was 0%
        var db = CreateDb();
        var svc = new WeekCycleService(db);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.SetPercentagesAsync(999, 50, 30, 20));
    }

    // ── WeekCycleService gap: branch coverage on the || condition ───────────
    // cat1 < 0 || cat2 < 0 || cat3 < 0
    // Existing tests cover each individually; this hits the "all positive but
    // sum wrong" path to ensure the second condition's short-circuit is covered.

    [Fact]
    public async Task SetPercentages_Throws_WhenAllPositiveButSumNot100()
    {
        var db = CreateDb();
        var svc = new WeekCycleService(db);

        // cat1=40, cat2=40, cat3=40 → all positive (no negative branch hit),
        // but sum=120 → hits the sum check branch
        await Assert.ThrowsAsync<ArgumentException>(
            () => svc.SetPercentagesAsync(1, 40, 40, 40));
    }

    // ── PlanService gap: actualHours null path (HasValue = false) ────────────
    // Line 121: if (actualHours.HasValue && actualHours.Value < 0)
    // The branch where HasValue=false (null passed in) was not explicitly
    // tested as a passing case — we had tests for negative, but not null passing.

    [Fact]
    public async Task UpdateProgress_Succeeds_WhenActualHoursIsNull()
    {
        // Covers: actualHours.HasValue == false → skips the < 0 check entirely
        var db = CreateDb();

        var member = new Member { Id = 1, Name = "Alice", IsLead = false };
        var plan = new WeeklyPlan { Id = 1, MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry
        {
            Id = 1, WeeklyPlanId = 1, BacklogItemId = 1,
            PlannedHours = 10, ProgressPercent = 0
        };
        entry.WeeklyPlan = plan;

        db.Members.Add(member);
        db.WeeklyPlans.Add(plan);
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        var svc = new PlanService(db);

        // actualHours = null → HasValue is false → no exception thrown
        await svc.UpdateProgressAsync(1, 50, null);

        var updated = await db.PlanEntries.FindAsync(1);
        Assert.Equal(50, updated!.ProgressPercent);
        Assert.Null(updated.ActualHours);
    }
}