using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

namespace WeeklyPlanner.Tests;

/// <summary>
/// Tests for PlanService — business rules, validation, freeze logic.
/// </summary>
public class PlanServiceTests
{
    private AppDbContext GetDb() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    /// <summary>Creates a DB with a member, week cycle, and 3 backlog items (one per category).</summary>
    private async Task<AppDbContext> SeededDb()
    {
        var db = GetDb();
        db.Members.Add(new Member { Id = 1, Name = "Alice" });
        db.WeekCycles.Add(new WeekCycle
        {
            Id = 1, PlanningDate = DateTime.Today,
            WeekStartDate = DateTime.Today, WeekEndDate = DateTime.Today.AddDays(5),
            Category1Percent = 50, Category2Percent = 30, Category3Percent = 20
        });
        db.BacklogItems.AddRange(
            new BacklogItem { Id = 1, Title = "T1", Category = 1, IsActive = true },
            new BacklogItem { Id = 2, Title = "T2", Category = 2, IsActive = true },
            new BacklogItem { Id = 3, Title = "T3", Category = 3, IsActive = true });
        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenTotalHoursExceed30()
    {
        var db      = GetDb();
        var entries = new List<PlanEntry>
        {
            new() { BacklogItemId = 1, PlannedHours = 20 },
            new() { BacklogItemId = 2, PlannedHours = 15 }  // 35 total
        };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*cannot exceed 30*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenNegativeHours()
    {
        var db      = GetDb();
        var entries = new List<PlanEntry> { new() { BacklogItemId = 1, PlannedHours = -5 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenDuplicateBacklogItems()
    {
        var db      = GetDb();
        var entries = new List<PlanEntry>
        {
            new() { BacklogItemId = 1, PlannedHours = 5 },
            new() { BacklogItemId = 1, PlannedHours = 3 }  // duplicate!
        };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*duplicate*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenCategoryLimitExceeded()
    {
        var db      = await SeededDb();
        // Cat1 limit = 50% of 30 = 15 hrs. Trying 20hrs in Cat1.
        var entries = new List<PlanEntry> { new() { BacklogItemId = 1, PlannedHours = 20 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Cat 1*");
    }

    [Fact]
    public async Task SubmitPlan_Succeeds_WithValidData()
    {
        var db      = await SeededDb();
        var entries = new List<PlanEntry>
        {
            new() { BacklogItemId = 1, PlannedHours = 10 }, // Cat1: 10 <= 15 ✓
            new() { BacklogItemId = 2, PlannedHours = 8  }, // Cat2: 8  <= 9  ✓
            new() { BacklogItemId = 3, PlannedHours = 5  }, // Cat3: 5  <= 6  ✓
        };
        var result = await new PlanService(db).SubmitPlanAsync(1, 1, entries);

        result.IsFrozen.Should().BeTrue();
        result.PlanEntries.Should().HaveCount(3);
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenPlanAlreadyExists()
    {
        var db = await SeededDb();
        db.WeeklyPlans.Add(new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true });
        await db.SaveChangesAsync();

        var entries = new List<PlanEntry> { new() { BacklogItemId = 1, PlannedHours = 5 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task UpdateProgress_Throws_WhenPlanNotFrozen()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = false };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db)
            .Invoking(s => s.UpdateProgressAsync(entry.Id, 50, null))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task UpdateProgress_Throws_WhenProgressOver100()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db)
            .Invoking(s => s.UpdateProgressAsync(entry.Id, 150, null))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*exceed 100*");
    }

    [Fact]
    public async Task UpdateProgress_Throws_WhenProgressNegative()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db)
            .Invoking(s => s.UpdateProgressAsync(entry.Id, -10, null))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public async Task UpdateProgress_Throws_WhenActualHoursNegative()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db)
            .Invoking(s => s.UpdateProgressAsync(entry.Id, 50, -2))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Actual hours*");
    }

    [Fact]
    public async Task UpdateProgress_Succeeds_WithValidData()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db).UpdateProgressAsync(entry.Id, 75, 3.5m);

        var updated = await db.PlanEntries.FindAsync(entry.Id);
        updated!.ProgressPercent.Should().Be(75);
        updated.ActualHours.Should().Be(3.5m);
    }
}