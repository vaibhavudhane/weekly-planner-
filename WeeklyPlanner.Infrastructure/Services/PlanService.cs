using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;
using WeeklyPlanner.Infrastructure.Data;

namespace WeeklyPlanner.Infrastructure.Services;

/// <summary>
/// Core planning logic. Enforces all business rules:
/// - 30 hour cap
/// - No negative hours
/// - No duplicate backlog items
/// - Category % limits enforced server-side
/// - Progress validation (0-100 range)
/// </summary>
public class PlanService : IPlanService
{
    private readonly AppDbContext _db;
    public PlanService(AppDbContext db) => _db = db;

    public async Task<WeeklyPlan?> GetPlanAsync(int memberId, int weekCycleId) =>
        await _db.WeeklyPlans
            .Include(p => p.Member)
            .Include(p => p.PlanEntries).ThenInclude(e => e.BacklogItem)
            .FirstOrDefaultAsync(p => p.MemberId == memberId && p.WeekCycleId == weekCycleId);

    /// <summary>
    /// Validates and submits a member's plan, immediately freezing it.
    /// Once frozen, only progress updates are allowed.
    /// </summary>
    public async Task<WeeklyPlan> SubmitPlanAsync(int memberId, int weekCycleId, List<PlanEntry> entries)
    {
        const decimal TOTAL_HOURS = 30m;

        // Guard: at least one entry required
        if (!entries.Any())
            throw new ArgumentException("Plan must contain at least one task.");

        // Guard: no negative planned hours
        if (entries.Any(e => e.PlannedHours < 0))
            throw new ArgumentException("Planned hours cannot be negative.");

        // Guard: no duplicate backlog items in same plan
        var hasDuplicates = entries.GroupBy(e => e.BacklogItemId).Any(g => g.Count() > 1);
        if (hasDuplicates)
            throw new ArgumentException("Plan contains duplicate backlog items.");

        // Guard: total hours cap
        var totalHours = entries.Sum(e => e.PlannedHours);
        if (totalHours > TOTAL_HOURS)
            throw new ArgumentException($"Total planned hours ({totalHours}) cannot exceed 30.");

        // Guard: category % limits (enforced server-side)
        var cycle = await _db.WeekCycles.FindAsync(weekCycleId)
            ?? throw new KeyNotFoundException($"WeekCycle {weekCycleId} not found.");

        var backlogIds   = entries.Select(e => e.BacklogItemId).ToList();
        var backlogItems = await _db.BacklogItems
            .Where(b => backlogIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Category);

        var cat1Max  = Math.Round(TOTAL_HOURS * cycle.Category1Percent / 100, 1);
        var cat2Max  = Math.Round(TOTAL_HOURS * cycle.Category2Percent / 100, 1);
        var cat3Max  = Math.Round(TOTAL_HOURS * cycle.Category3Percent / 100, 1);

        var cat1Used = entries.Where(e => backlogItems.GetValueOrDefault(e.BacklogItemId) == 1).Sum(e => e.PlannedHours);
        var cat2Used = entries.Where(e => backlogItems.GetValueOrDefault(e.BacklogItemId) == 2).Sum(e => e.PlannedHours);
        var cat3Used = entries.Where(e => backlogItems.GetValueOrDefault(e.BacklogItemId) == 3).Sum(e => e.PlannedHours);

        if (cat1Used > cat1Max)
            throw new ArgumentException($"Cat 1 hours ({cat1Used}) exceed {cycle.Category1Percent}% limit ({cat1Max} hrs).");
        if (cat2Used > cat2Max)
            throw new ArgumentException($"Cat 2 hours ({cat2Used}) exceed {cycle.Category2Percent}% limit ({cat2Max} hrs).");
        if (cat3Used > cat3Max)
            throw new ArgumentException($"Cat 3 hours ({cat3Used}) exceed {cycle.Category3Percent}% limit ({cat3Max} hrs).");

        // Guard: plan must not already exist for this member + week
        var existing = await _db.WeeklyPlans
            .FirstOrDefaultAsync(p => p.MemberId == memberId && p.WeekCycleId == weekCycleId);
        if (existing != null)
            throw new InvalidOperationException("A plan already exists for this member and week.");

        // All validations passed — create and freeze the plan
        var plan = new WeeklyPlan
        {
            MemberId    = memberId,
            WeekCycleId = weekCycleId,
            IsFrozen    = true,
            FrozenAt    = DateTime.UtcNow,
            PlanEntries = entries
        };

        _db.WeeklyPlans.Add(plan);
        await _db.SaveChangesAsync();
        return plan;
    }

    /// <summary>
    /// Updates progress % and optional actual hours on a frozen plan entry.
    /// Validates 0-100 range and no negative actual hours.
    /// </summary>
    public async Task UpdateProgressAsync(int planEntryId, decimal progressPercent, decimal? actualHours)
    {
        if (progressPercent < 0)
            throw new ArgumentException("Progress percent cannot be negative.");
        if (progressPercent > 100)
            throw new ArgumentException("Progress percent cannot exceed 100.");
        if (actualHours.HasValue && actualHours.Value < 0)
            throw new ArgumentException("Actual hours cannot be negative.");

        var entry = await _db.PlanEntries
            .Include(e => e.WeeklyPlan)
            .FirstOrDefaultAsync(e => e.Id == planEntryId)
            ?? throw new KeyNotFoundException($"PlanEntry {planEntryId} not found.");

        if (!entry.WeeklyPlan.IsFrozen)
            throw new InvalidOperationException("Plan must be frozen before updating progress.");

        entry.ProgressPercent = progressPercent;
        entry.ActualHours     = actualHours;
        entry.LastUpdated     = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<WeeklyPlan>> GetAllPlansForWeekAsync(int weekCycleId) =>
        await _db.WeeklyPlans
            .Include(p => p.Member)
            .Include(p => p.PlanEntries).ThenInclude(e => e.BacklogItem)
            .Where(p => p.WeekCycleId == weekCycleId)
            .ToListAsync();
}