using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

namespace WeeklyPlanner.Tests;

/// <summary>
/// Tests for WeekCycleService — percentage validation and week management.
/// </summary>
public class WeekCycleServiceTests
{
    private AppDbContext GetDb() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private async Task<AppDbContext> WithCycle()
    {
        var db = GetDb();
        db.WeekCycles.Add(new WeekCycle
        {
            Id = 1, PlanningDate = DateTime.Today,
            WeekStartDate = DateTime.Today, WeekEndDate = DateTime.Today.AddDays(5),
            Category1Percent = 40, Category2Percent = 40, Category3Percent = 20
        });
        await db.SaveChangesAsync();
        return db;
    }

    // ── SetPercentagesAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task SetPercentages_Throws_WhenSumNot100()
    {
        await new WeekCycleService(await WithCycle())
            .Invoking(s => s.SetPercentagesAsync(1, 40, 30, 20))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*sum to exactly 100*");
    }

    [Fact]
    public async Task SetPercentages_Throws_WhenValueIsNegative()
    {
        await new WeekCycleService(await WithCycle())
            .Invoking(s => s.SetPercentagesAsync(1, -10, 60, 50))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public async Task SetPercentages_Throws_WhenCategory2IsNegative()
    {
        await new WeekCycleService(await WithCycle())
            .Invoking(s => s.SetPercentagesAsync(1, 60, -10, 50))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public async Task SetPercentages_Throws_WhenCategory3IsNegative()
    {
        await new WeekCycleService(await WithCycle())
            .Invoking(s => s.SetPercentagesAsync(1, 60, 50, -10))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*negative*");
    }

    [Fact]
    public async Task SetPercentages_Succeeds_WhenSumIs100()
    {
        var db = await WithCycle();
        await new WeekCycleService(db).SetPercentagesAsync(1, 50, 30, 20);
        (await db.WeekCycles.FindAsync(1))!.Category1Percent.Should().Be(50);
    }

    [Fact]
    public async Task SetPercentages_Succeeds_AndPersistsAllThreeCategories()
    {
        var db = await WithCycle();
        await new WeekCycleService(db).SetPercentagesAsync(1, 60, 25, 15);
        var cycle = await db.WeekCycles.FindAsync(1);
        cycle!.Category1Percent.Should().Be(60);
        cycle.Category2Percent.Should().Be(25);
        cycle.Category3Percent.Should().Be(15);
    }

    [Fact]
    public async Task SetPercentages_Succeeds_WithEqualSplit()
    {
        var db = await WithCycle();
        await new WeekCycleService(db).SetPercentagesAsync(1, 34, 33, 33);
        var cycle = await db.WeekCycles.FindAsync(1);
        (cycle!.Category1Percent + cycle.Category2Percent + cycle.Category3Percent).Should().Be(100);
    }

    // ── CreateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateCycle_PersistsToDatabase()
    {
        var cycle = new WeekCycle
        {
            PlanningDate  = DateTime.Today,
            WeekStartDate = DateTime.Today,
            WeekEndDate   = DateTime.Today.AddDays(5)
        };
        var result = await new WeekCycleService(GetDb()).CreateAsync(cycle);
        result.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateCycle_StoresCorrectDates()
    {
        var db    = GetDb();
        var start = DateTime.Today;
        var end   = DateTime.Today.AddDays(5);
        var cycle = new WeekCycle { PlanningDate = start, WeekStartDate = start, WeekEndDate = end };

        var result = await new WeekCycleService(db).CreateAsync(cycle);

        result.WeekStartDate.Should().Be(start);
        result.WeekEndDate.Should().Be(end);
    }

    // ── GetCurrentAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetCurrent_ReturnsLatestActiveWeek()
    {
        var db = GetDb();
        db.WeekCycles.AddRange(
            new WeekCycle
            {
                Id = 1, PlanningDate = DateTime.Today.AddDays(-7),
                WeekStartDate = DateTime.Today.AddDays(-7), WeekEndDate = DateTime.Today.AddDays(-2),
                IsActive = true
            },
            new WeekCycle
            {
                Id = 2, PlanningDate = DateTime.Today,
                WeekStartDate = DateTime.Today, WeekEndDate = DateTime.Today.AddDays(5),
                IsActive = true
            });
        await db.SaveChangesAsync();

        var result = await new WeekCycleService(db).GetCurrentAsync();
        result!.Id.Should().Be(2); // most recent
    }

    [Fact]
    public async Task GetCurrent_ReturnsNull_WhenNoActiveCycles()
    {
        var db = GetDb();
        db.WeekCycles.Add(new WeekCycle
        {
            Id = 1, PlanningDate = DateTime.Today,
            WeekStartDate = DateTime.Today, WeekEndDate = DateTime.Today.AddDays(5),
            IsActive = false  // inactive
        });
        await db.SaveChangesAsync();

        var result = await new WeekCycleService(db).GetCurrentAsync();
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCurrent_ReturnsNull_WhenDatabaseIsEmpty()
    {
        var result = await new WeekCycleService(GetDb()).GetCurrentAsync();
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCurrent_IgnoresInactiveCycles_WhenActiveOnesExist()
    {
        var db = GetDb();
        db.WeekCycles.AddRange(
            new WeekCycle
            {
                Id = 1, PlanningDate = DateTime.Today.AddDays(-14),
                WeekStartDate = DateTime.Today.AddDays(-14), WeekEndDate = DateTime.Today.AddDays(-9),
                IsActive = false  // should be ignored
            },
            new WeekCycle
            {
                Id = 2, PlanningDate = DateTime.Today,
                WeekStartDate = DateTime.Today, WeekEndDate = DateTime.Today.AddDays(5),
                IsActive = true
            });
        await db.SaveChangesAsync();

        var result = await new WeekCycleService(db).GetCurrentAsync();
        result!.Id.Should().Be(2);
    }
}
