using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Controllers;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using Xunit;

namespace WeeklyPlanner.Tests;

public class MembersControllerTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static MembersController CreateController(AppDbContext db)
    {
        var controller = new MembersController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithAllMembers()
    {
        var db = CreateDb();
        db.Members.AddRange(
            new Member { Id = 1, Name = "Team Lead", IsLead = true },
            new Member { Id = 2, Name = "Alice", IsLead = false }
        );
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var members = Assert.IsAssignableFrom<IEnumerable<Member>>(ok.Value);
        Assert.Equal(2, members.Count());
    }

    [Fact]
    public async Task GetAll_EmptyDb_ReturnsOkWithEmptyList()
    {
        var db = CreateDb();
        var controller = CreateController(db);

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var members = Assert.IsAssignableFrom<IEnumerable<Member>>(ok.Value);
        Assert.Empty(members);
    }

    [Fact]
    public async Task Create_ValidMember_ReturnsOkAndPersists()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        var newMember = new Member { Name = "Charlie", IsLead = false };

        var result = await controller.Create(newMember);

        var ok = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<Member>(ok.Value);
        Assert.Equal("Charlie", returned.Name);
        Assert.Equal(1, await db.Members.CountAsync());
    }

    [Fact]
    public async Task Create_LeadMember_PersistsIsLeadTrue()
    {
        var db = CreateDb();
        var controller = CreateController(db);
        var lead = new Member { Name = "New Lead", IsLead = true };

        await controller.Create(lead);

        var saved = await db.Members.FirstAsync();
        Assert.True(saved.IsLead);
    }
}