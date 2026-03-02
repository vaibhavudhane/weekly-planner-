using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

namespace WeeklyPlanner.Tests;

/// <summary>
/// Tests for BacklogService — CRUD and soft-delete behavior.
/// </summary>
public class BacklogServiceTests
{
    private AppDbContext GetDb() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task GetAll_ReturnsOnlyActiveItems()
    {
        var db = GetDb();
        db.BacklogItems.AddRange(
            new BacklogItem { Title = "Active",  Category = 1, IsActive = true  },
            new BacklogItem { Title = "Deleted", Category = 2, IsActive = false });
        await db.SaveChangesAsync();

        var result = await new BacklogService(db).GetAllAsync();

        result.Should().HaveCount(1);
        result.First().Title.Should().Be("Active");
    }

    [Fact]
    public async Task Create_PersistsItemToDatabase()
    {
        var db     = GetDb();
        var result = await new BacklogService(db)
            .CreateAsync(new BacklogItem { Title = "Task", Category = 1 });

        result.Id.Should().BeGreaterThan(0);
        db.BacklogItems.Should().HaveCount(1);
    }

    [Fact]
    public async Task Update_ModifiesExistingItem()
    {
        var db   = GetDb();
        var item = new BacklogItem { Title = "Old", Category = 1, IsActive = true };
        db.BacklogItems.Add(item);
        await db.SaveChangesAsync();

        item.Title = "Updated";
        await new BacklogService(db).UpdateAsync(item);

        (await db.BacklogItems.FindAsync(item.Id))!.Title.Should().Be("Updated");
    }

    [Fact]
    public async Task Delete_SoftDeletesRow_DoesNotRemoveFromDb()
    {
        var db   = GetDb();
        var item = new BacklogItem { Title = "Task", Category = 1, IsActive = true };
        db.BacklogItems.Add(item);
        await db.SaveChangesAsync();

        await new BacklogService(db).DeleteAsync(item.Id);

        var inDb = await db.BacklogItems.FindAsync(item.Id);
        inDb.Should().NotBeNull();
        inDb!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_DoesNotThrow_WhenItemNotFound()
    {
        await new BacklogService(GetDb())
            .Invoking(s => s.DeleteAsync(999))
            .Should().NotThrowAsync();
    }

    [Fact]
    public async Task GetById_ReturnsNull_WhenNotFound()
    {
        (await new BacklogService(GetDb()).GetByIdAsync(999))
            .Should().BeNull();
    }
}