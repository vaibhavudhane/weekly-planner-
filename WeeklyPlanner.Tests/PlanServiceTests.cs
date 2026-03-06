using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

namespace WeeklyPlanner.Tests;

public class PlanServiceTests
{
    private AppDbContext GetDb() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

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

    // ── SubmitPlanAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task SubmitPlan_Throws_WhenEntriesListIsEmpty()
    {
        var db = await SeededDb();
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, new List<PlanEntry>()))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenNegativeHours()
    {
        var db = GetDb();
        var entries = new List<PlanEntry> { new() { BacklogItemId = 1, PlannedHours = -5 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenDuplicateBacklogItems()
    {
        var db = GetDb();
        var entries = new List<PlanEntry>
        {
            new() { BacklogItemId = 1, PlannedHours = 5 },
            new() { BacklogItemId = 1, PlannedHours = 3 }
        };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*duplicate*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenTotalHoursExceed30()
    {
        var db = GetDb();
        var entries = new List<PlanEntry>
        {
            new() { BacklogItemId = 1, PlannedHours = 20 },
            new() { BacklogItemId = 2, PlannedHours = 15 }
        };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*cannot exceed 30*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenCat1LimitExceeded()
    {
        var db = await SeededDb();
        var entries = new List<PlanEntry> { new() { BacklogItemId = 1, PlannedHours = 20 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Cat 1*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenCat2LimitExceeded()
    {
        var db = await SeededDb();
        // Cat2 = 30% of 30 = 9 hrs max
        var entries = new List<PlanEntry> { new() { BacklogItemId = 2, PlannedHours = 12 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Cat 2*");
    }

    [Fact]
    public async Task SubmitPlan_Throws_WhenCat3LimitExceeded()
    {
        var db = await SeededDb();
        // Cat3 = 20% of 30 = 6 hrs max
        var entries = new List<PlanEntry> { new() { BacklogItemId = 3, PlannedHours = 8 } };
        await new PlanService(db)
            .Invoking(s => s.SubmitPlanAsync(1, 1, entries))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Cat 3*");
    }

    [Fact]
    public async Task SubmitPlan_Succeeds_WithValidData()
    {
        var db = await SeededDb();
        var entries = new List<PlanEntry>
        {
            new() { BacklogItemId = 1, PlannedHours = 10 },
            new() { BacklogItemId = 2, PlannedHours = 8  },
            new() { BacklogItemId = 3, PlannedHours = 5  },
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

    // ── UpdateProgressAsync ──────────────────────────────────────────────────

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
    public async Task UpdateProgress_Throws_WhenEntryNotFound()
    {
        await new PlanService(GetDb())
            .Invoking(s => s.UpdateProgressAsync(999, 50, null))
            .Should().ThrowAsync<Exception>();
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

    [Fact]
    public async Task UpdateProgress_Succeeds_WithZeroPercent()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db).UpdateProgressAsync(entry.Id, 0, null);
        (await db.PlanEntries.FindAsync(entry.Id))!.ProgressPercent.Should().Be(0);
    }

    [Fact]
    public async Task UpdateProgress_Succeeds_With100Percent()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        var entry = new PlanEntry  { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 };
        db.PlanEntries.Add(entry);
        await db.SaveChangesAsync();

        await new PlanService(db).UpdateProgressAsync(entry.Id, 100, 5m);

        var updated = await db.PlanEntries.FindAsync(entry.Id);
        updated!.ProgressPercent.Should().Be(100);
        updated.ActualHours.Should().Be(5m);
    }

    // ── GetPlanAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPlan_ReturnsNull_WhenNotFound()
    {
        (await new PlanService(GetDb()).GetPlanAsync(999, 999)).Should().BeNull();
    }

    


    [Fact]
public async Task GetPlan_ReturnsCorrectPlan_WhenExists()
{
    var db = GetDb();
    db.Members.Add(new Member { Id = 1, Name = "Alice" });
    db.WeekCycles.Add(new WeekCycle
    {
        Id = 1, PlanningDate = DateTime.Today,
        WeekStartDate = DateTime.Today, WeekEndDate = DateTime.Today.AddDays(5),
        Category1Percent = 50, Category2Percent = 30, Category3Percent = 20
    });
    var plan = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
    db.WeeklyPlans.Add(plan);
    await db.SaveChangesAsync();

    var result = await new PlanService(db).GetPlanAsync(1, 1);
    result.Should().NotBeNull();
    result!.MemberId.Should().Be(1);
}


   [Fact]
public async Task GetPlan_ReturnsPlanWithEntries()
{
    var db = GetDb();
    db.Members.Add(new Member { Id = 1, Name = "Alice" });
    db.BacklogItems.Add(new BacklogItem { Id = 1, Title = "T1", Category = 1, IsActive = true });
    var plan = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
    db.WeeklyPlans.Add(plan);
    db.PlanEntries.Add(new PlanEntry { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 8 });
    await db.SaveChangesAsync();

    var result = await new PlanService(db).GetPlanAsync(1, 1);
    result.Should().NotBeNull();
    result!.PlanEntries.Should().HaveCount(1);
}

    // ── GetAllPlansForWeekAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetAllPlansForWeek_ReturnsEmpty_WhenNoPlanForCycle()
    {
        (await new PlanService(GetDb()).GetAllPlansForWeekAsync(999)).Should().BeEmpty();
    }

    [Fact]
public async Task GetAllPlansForWeek_ReturnsAllPlansForCycle()
{
    var db = GetDb();
    db.Members.AddRange(
        new Member { Id = 1, Name = "Alice" },
        new Member { Id = 2, Name = "Bob" },
        new Member { Id = 3, Name = "Carol" }
    );
    db.WeeklyPlans.AddRange(
        new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true  },
        new WeeklyPlan { MemberId = 2, WeekCycleId = 1, IsFrozen = false },
        new WeeklyPlan { MemberId = 3, WeekCycleId = 2, IsFrozen = true  }
    );
    await db.SaveChangesAsync();

    var result = await new PlanService(db).GetAllPlansForWeekAsync(1);
    result.Should().HaveCount(2);
}

   [Fact]
public async Task GetAllPlansForWeek_IncludesPlanEntries()
{
    var db = GetDb();
    db.Members.Add(new Member { Id = 1, Name = "Alice" });
    db.BacklogItems.AddRange(
        new BacklogItem { Id = 1, Title = "T1", Category = 1, IsActive = true },
        new BacklogItem { Id = 2, Title = "T2", Category = 2, IsActive = true }
    );
    var plan = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
    db.WeeklyPlans.Add(plan);
    db.PlanEntries.AddRange(
        new PlanEntry { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 },
        new PlanEntry { WeeklyPlan = plan, BacklogItemId = 2, PlannedHours = 3 }
    );
    await db.SaveChangesAsync();

    var result = await new PlanService(db).GetAllPlansForWeekAsync(1);
    result.First().PlanEntries.Should().HaveCount(2);
}

    // ── DeletePlanAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task DeletePlan_ReturnsFalse_WhenPlanNotFound()
    {
        (await new PlanService(GetDb()).DeletePlanAsync(999, 999)).Should().BeFalse();
    }

    [Fact]
    public async Task DeletePlan_ReturnsTrue_AndRemovesPlan()
    {
        var db   = GetDb();
        var plan = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        db.WeeklyPlans.Add(plan);
        await db.SaveChangesAsync();

        var result = await new PlanService(db).DeletePlanAsync(1, 1);

        result.Should().BeTrue();
        db.WeeklyPlans.Should().BeEmpty();
    }

    [Fact]
    public async Task DeletePlan_AlsoDeletesEntries()
    {
        var db    = GetDb();
        var plan  = new WeeklyPlan { MemberId = 1, WeekCycleId = 1, IsFrozen = true };
        db.PlanEntries.Add(new PlanEntry { WeeklyPlan = plan, BacklogItemId = 1, PlannedHours = 5 });
        await db.SaveChangesAsync();

        await new PlanService(db).DeletePlanAsync(1, 1);

        db.PlanEntries.Should().BeEmpty();
        db.WeeklyPlans.Should().BeEmpty();
    }
}
