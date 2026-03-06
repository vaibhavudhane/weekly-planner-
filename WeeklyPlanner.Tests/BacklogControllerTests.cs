using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;
using Xunit;

namespace WeeklyPlanner.Tests;

public class BacklogControllerTests
{
    private static BacklogController CreateController(IBacklogService svc)
    {
        var controller = new BacklogController(svc);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithItems()
    {
        var items = new List<BacklogItem>
        {
            new() { Id = 1, Title = "Fix login bug", Category = 1 },
            new() { Id = 2, Title = "Refactor auth", Category = 2 }
        };
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.GetAllAsync()).ReturnsAsync(items);

        var controller = CreateController(mock.Object);
        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(items, ok.Value);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOk()
    {
        var item = new BacklogItem { Id = 1, Title = "Fix login bug", Category = 1 };
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(item);

        var controller = CreateController(mock.Object);
        var result = await controller.GetById(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(item, ok.Value);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((BacklogItem?)null);

        var controller = CreateController(mock.Object);
        var result = await controller.GetById(99);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ValidItem_ReturnsOkWithCreatedItem()
    {
        var input = new BacklogItem { Title = "New Task", Category = 1 };
        var saved = new BacklogItem { Id = 10, Title = "New Task", Category = 1 };
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.CreateAsync(input)).ReturnsAsync(saved);

        var controller = CreateController(mock.Object);
        var result = await controller.Create(input);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(saved, ok.Value);
    }

    [Fact]
    public async Task Update_ValidItem_ReturnsOkWithUpdatedItem()
    {
        var updated = new BacklogItem { Id = 1, Title = "Updated Task", Category = 2 };
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.UpdateAsync(It.Is<BacklogItem>(i => i.Id == 1))).ReturnsAsync(updated);

        var controller = CreateController(mock.Object);
        var result = await controller.Update(1, new BacklogItem { Title = "Updated Task", Category = 2 });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(updated, ok.Value);
    }

    [Fact]
    public async Task Update_SetsIdFromRoute()
    {
        BacklogItem? captured = null;
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.UpdateAsync(It.IsAny<BacklogItem>()))
            .Callback<BacklogItem>(item => captured = item)
            .ReturnsAsync(new BacklogItem { Id = 5 });

        var controller = CreateController(mock.Object);
        await controller.Update(5, new BacklogItem { Title = "Task" });

        Assert.Equal(5, captured!.Id);
    }

    [Fact]
    public async Task Delete_ExistingId_ReturnsNoContent()
    {
        var mock = new Mock<IBacklogService>();
        mock.Setup(s => s.DeleteAsync(1)).Returns(Task.CompletedTask);

        var controller = CreateController(mock.Object);
        var result = await controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
    }
}