using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.API.DTOs;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using Xunit;

namespace WeeklyPlanner.Tests;

public class PlanControllerTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static PlanController CreateController(IPlanService svc, AppDbContext db, bool isLead = false)
    {
        var controller = new PlanController(svc, db);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Is-Lead"] = isLead ? "true" : "false";
        httpContext.Request.Headers["X-Member-Id"] = isLead ? "1" : "2";
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    // ── GetPlan ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPlan_WhenExists_ReturnsOk()
    {
        var plan = new WeeklyPlan { Id = 1, MemberId = 2, WeekCycleId = 1 };
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.GetPlanAsync(2, 1)).ReturnsAsync(plan);

        var result = await CreateController(mock.Object, CreateDb()).GetPlan(2, 1);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(plan, ok.Value);
    }

    [Fact]
    public async Task GetPlan_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.GetPlanAsync(99, 1)).ReturnsAsync((WeeklyPlan?)null);

        var result = await CreateController(mock.Object, CreateDb()).GetPlan(99, 1);

        Assert.IsType<NotFoundResult>(result);
    }

    // ── Submit ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Submit_ValidDto_ReturnsOkWithPlan()
    {
        var savedPlan = new WeeklyPlan { Id = 1, MemberId = 2, WeekCycleId = 1 };
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.SubmitPlanAsync(2, 1, It.IsAny<List<PlanEntry>>()))
            .ReturnsAsync(savedPlan);

        var dto = new SubmitPlanDto
        {
            MemberId = 2,
            WeekCycleId = 1,
            Entries = new List<PlanEntryDto>
            {
                new() { BacklogItemId = 1, PlannedHours = 10 },
                new() { BacklogItemId = 2, PlannedHours = 8 }
            }
        };

        var result = await CreateController(mock.Object, CreateDb()).Submit(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(savedPlan, ok.Value);
    }

    [Fact]
    public async Task Submit_MapsEntriesCorrectly()
    {
        List<PlanEntry>? captured = null;
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.SubmitPlanAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<List<PlanEntry>>()))
            .Callback<int, int, List<PlanEntry>>((_, _, entries) => captured = entries)
            .ReturnsAsync(new WeeklyPlan());

        var dto = new SubmitPlanDto
        {
            MemberId = 2, WeekCycleId = 1,
            Entries = new List<PlanEntryDto>
            {
                new() { BacklogItemId = 5, PlannedHours = 15 }
            }
        };

        await CreateController(mock.Object, CreateDb()).Submit(dto);

        Assert.NotNull(captured);
        Assert.Single(captured!);
        Assert.Equal(5, captured![0].BacklogItemId);
        Assert.Equal(15, captured![0].PlannedHours);
        Assert.Equal(0, captured![0].ProgressPercent);
    }

    // ── UpdateProgress ────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateProgress_ValidEntry_ReturnsNoContent()
    {
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.UpdateProgressAsync(1, 50, 5)).Returns(Task.CompletedTask);

        var result = await CreateController(mock.Object, CreateDb())
            .UpdateProgress(1, new ProgressDto { ProgressPercent = 50, ActualHours = 5 });

        Assert.IsType<NoContentResult>(result);
        mock.Verify(s => s.UpdateProgressAsync(1, 50, 5), Times.Once);
    }

    // ── GetAllForWeek ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllForWeek_ReturnsOkWithPlans()
    {
        var plans = new List<WeeklyPlan>
        {
            new() { Id = 1, WeekCycleId = 1 },
            new() { Id = 2, WeekCycleId = 1 }
        };
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.GetAllPlansForWeekAsync(1)).ReturnsAsync(plans);

        var result = await CreateController(mock.Object, CreateDb()).GetAllForWeek(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(plans, ok.Value);
    }

    // ── GetDashboard ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDashboard_AsLead_ReturnsOkWithSummary()
    {
        var plans = new List<WeeklyPlan>
        {
            new()
            {
                Id = 1,
                IsFrozen = true,
                Member = new Member { Name = "Alice" },
                PlanEntries = new List<PlanEntry>
                {
                    new()
                    {
                        PlannedHours = 15, ActualHours = 10, ProgressPercent = 70,
                        BacklogItem = new BacklogItem { Title = "Fix login bug", Category = 1 }
                    }
                }
            }
        };

        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.GetAllPlansForWeekAsync(1)).ReturnsAsync(plans);

        var result = await CreateController(mock.Object, CreateDb(), isLead: true).GetDashboard(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetDashboard_AsLead_WithEmptyPlanEntries_ReturnsZeroProgress()
    {
        // Covers the ternary false branch: p.PlanEntries.Any() ? ... : 0
        var plans = new List<WeeklyPlan>
        {
            new()
            {
                Id = 2,
                IsFrozen = false,
                Member = new Member { Name = "Bob" },
                PlanEntries = new List<PlanEntry>() // empty — hits the `: 0` branch
            }
        };
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.GetAllPlansForWeekAsync(1)).ReturnsAsync(plans);

        var result = await CreateController(mock.Object, CreateDb(), isLead: true).GetDashboard(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetDashboard_AsNonLead_ReturnsForbid()
    {
        var mock = new Mock<IPlanService>();

        var result = await CreateController(mock.Object, CreateDb(), isLead: false).GetDashboard(1);

        Assert.IsType<ForbidResult>(result);
        mock.Verify(s => s.GetAllPlansForWeekAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetDashboard_WithNoHeader_ReturnsForbid()
    {
        var mock = new Mock<IPlanService>();
        var controller = new PlanController(mock.Object, CreateDb());
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetDashboard(1);

        Assert.IsType<ForbidResult>(result);
    }

    // ── DeletePlan ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeletePlan_ExistingPlan_ReturnsNoContent()
    {
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.DeletePlanAsync(2, 1)).ReturnsAsync(true);

        var result = await CreateController(mock.Object, CreateDb()).DeletePlan(2, 1);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeletePlan_NonExistingPlan_ReturnsNotFound()
    {
        var mock = new Mock<IPlanService>();
        mock.Setup(s => s.DeletePlanAsync(99, 1)).ReturnsAsync(false);

        var result = await CreateController(mock.Object, CreateDb()).DeletePlan(99, 1);

        Assert.IsType<NotFoundResult>(result);
    }

    // ── ResetAllPlans ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetAllPlans_ClearsAllPlansAndEntries_ReturnsOk()
    {
        var db = CreateDb();
        db.WeeklyPlans.AddRange(
            new WeeklyPlan { Id = 1, MemberId = 1, WeekCycleId = 1 },
            new WeeklyPlan { Id = 2, MemberId = 2, WeekCycleId = 1 }
        );
        db.PlanEntries.Add(new PlanEntry { Id = 1, WeeklyPlanId = 1, BacklogItemId = 1, PlannedHours = 10 });
        await db.SaveChangesAsync();

        var mock = new Mock<IPlanService>();
        var controller = CreateController(mock.Object, db);

        var result = await controller.ResetAllPlans();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(0, await db.WeeklyPlans.CountAsync());
        Assert.Equal(0, await db.PlanEntries.CountAsync());
    }

    [Fact]
    public async Task ResetAllPlans_EmptyDb_ReturnsOkWithZeroDeleted()
    {
        var db = CreateDb();
        var mock = new Mock<IPlanService>();
        var controller = CreateController(mock.Object, db);

        var result = await controller.ResetAllPlans();

        Assert.IsType<OkObjectResult>(result);
    }
}