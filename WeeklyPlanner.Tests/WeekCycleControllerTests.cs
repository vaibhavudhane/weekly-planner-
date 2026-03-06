using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.API.DTOs;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;
using Xunit;

namespace WeeklyPlanner.Tests;

public class WeekCycleControllerTests
{
    private static WeekCycleController CreateController(IWeekCycleService svc, bool isLead = false)
    {
        var controller = new WeekCycleController(svc);
        var httpContext = new DefaultHttpContext();
        if (isLead)
        {
            httpContext.Request.Headers["X-Is-Lead"] = "true";
            httpContext.Request.Headers["X-Member-Id"] = "1";
        }
        else
        {
            httpContext.Request.Headers["X-Is-Lead"] = "false";
            httpContext.Request.Headers["X-Member-Id"] = "2";
        }
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    [Fact]
    public async Task GetCurrent_WhenExists_ReturnsOk()
    {
        var cycle = new WeekCycle { Id = 1, IsActive = true };
        var mock = new Mock<IWeekCycleService>();
        mock.Setup(s => s.GetCurrentAsync()).ReturnsAsync(cycle);

        var result = await CreateController(mock.Object).GetCurrent();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(cycle, ok.Value);
    }

    [Fact]
    public async Task GetCurrent_WhenNone_ReturnsNotFound()
    {
        var mock = new Mock<IWeekCycleService>();
        mock.Setup(s => s.GetCurrentAsync()).ReturnsAsync((WeekCycle?)null);

        var result = await CreateController(mock.Object).GetCurrent();

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithAllCycles()
    {
        var cycles = new List<WeekCycle>
        {
            new() { Id = 1 }, new() { Id = 2 }
        };
        var mock = new Mock<IWeekCycleService>();
        mock.Setup(s => s.GetAllAsync()).ReturnsAsync(cycles);

        var result = await CreateController(mock.Object).GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(cycles, ok.Value);
    }

    [Fact]
    public async Task Create_ValidCycle_ReturnsOk()
    {
        var input = new WeekCycle { Id = 3 };
        var mock = new Mock<IWeekCycleService>();
        mock.Setup(s => s.CreateAsync(input)).ReturnsAsync(input);

        var result = await CreateController(mock.Object).Create(input);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(input, ok.Value);
    }

    [Fact]
    public async Task SetPercentages_AsLead_ReturnsNoContent()
    {
        var mock = new Mock<IWeekCycleService>();
        mock.Setup(s => s.SetPercentagesAsync(1, 50, 30, 20)).Returns(Task.CompletedTask);

        var controller = CreateController(mock.Object, isLead: true);
        var result = await controller.SetPercentages(1, new PercentageDto
        {
            Cat1 = 50, Cat2 = 30, Cat3 = 20
        });

        Assert.IsType<NoContentResult>(result);
        mock.Verify(s => s.SetPercentagesAsync(1, 50, 30, 20), Times.Once);
    }

    [Fact]
    public async Task SetPercentages_AsNonLead_ReturnsForbid()
    {
        var mock = new Mock<IWeekCycleService>();

        var controller = CreateController(mock.Object, isLead: false);
        var result = await controller.SetPercentages(1, new PercentageDto
        {
            Cat1 = 50, Cat2 = 30, Cat3 = 20
        });

        Assert.IsType<ForbidResult>(result);
        mock.Verify(s => s.SetPercentagesAsync(It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>()), Times.Never);
    }

    [Fact]
    public async Task SetPercentages_WithNoHeader_ReturnsForbid()
    {
        var mock = new Mock<IWeekCycleService>();
        // No headers set at all — IsLead should default to false
        var controller = new WeekCycleController(mock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var result = await controller.SetPercentages(1, new PercentageDto { Cat1 = 50, Cat2 = 30, Cat3 = 20 });

        Assert.IsType<ForbidResult>(result);
    }
}