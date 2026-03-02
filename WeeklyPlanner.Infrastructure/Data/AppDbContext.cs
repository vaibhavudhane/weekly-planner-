using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Models;

namespace WeeklyPlanner.Infrastructure.Data;

/// <summary>
/// Main database context for the Weekly Planner application.
/// Each DbSet maps to one SQL Server table.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── Tables ────────────────────────────────────────────────────────────────
    public DbSet<Member> Members => Set<Member>();
    public DbSet<BacklogItem> BacklogItems => Set<BacklogItem>();
    public DbSet<WeekCycle> WeekCycles => Set<WeekCycle>();
    public DbSet<WeeklyPlan> WeeklyPlans => Set<WeeklyPlan>();
    public DbSet<PlanEntry> PlanEntries => Set<PlanEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Decimal Precision ─────────────────────────────────────────────────
        // SQL Server requires explicit precision for decimal columns.
        // decimal(18,2) = up to 18 digits total, 2 after the decimal point.
        // e.g. 29.50 hours, 66.67 percent — both fit comfortably.

        modelBuilder.Entity<PlanEntry>()
            .Property(p => p.PlannedHours)
            .HasPrecision(18, 2);

        modelBuilder.Entity<PlanEntry>()
            .Property(p => p.ActualHours)
            .HasPrecision(18, 2);

        modelBuilder.Entity<PlanEntry>()
            .Property(p => p.ProgressPercent)
            .HasPrecision(18, 2);

        modelBuilder.Entity<WeekCycle>()
            .Property(w => w.Category1Percent)
            .HasPrecision(18, 2);

        modelBuilder.Entity<WeekCycle>()
            .Property(w => w.Category2Percent)
            .HasPrecision(18, 2);

        modelBuilder.Entity<WeekCycle>()
            .Property(w => w.Category3Percent)
            .HasPrecision(18, 2);

        // ── Seed Data — Members ───────────────────────────────────────────────
        // Only one member should have IsLead = true at any time.
        modelBuilder.Entity<Member>().HasData(
            new Member { Id = 1, Name = "Team Lead", IsLead = true  },
            new Member { Id = 2, Name = "Alice",     IsLead = false },
            new Member { Id = 3, Name = "Bob",       IsLead = false }
        );

        // ── Seed Data — Backlog Items ─────────────────────────────────────────
        // Category 1 = Client Focused
        // Category 2 = Tech Debt
        // Category 3 = R&D
        modelBuilder.Entity<BacklogItem>().HasData(
            new BacklogItem
            {
                Id = 1, Title = "Fix login bug", Category = 1,
                Description = "Client reported login issue", IsActive = true
            },
            new BacklogItem
            {
                Id = 2, Title = "Customer dashboard", Category = 1,
                Description = "New client feature", IsActive = true
            },
            new BacklogItem
            {
                Id = 3, Title = "Refactor auth module", Category = 2,
                Description = "Tech debt cleanup", IsActive = true
            },
            new BacklogItem
            {
                Id = 4, Title = "Database indexing", Category = 2,
                Description = "Performance improvement", IsActive = true
            },
            new BacklogItem
            {
                Id = 5, Title = "AI recommendation spike", Category = 3,
                Description = "Research ML options", IsActive = true
            },
            new BacklogItem
            {
                Id = 6, Title = "Cloud cost analysis", Category = 3,
                Description = "R&D for cost reduction", IsActive = true
            }
        );
    }
}