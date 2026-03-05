using Microsoft.AspNetCore.Mvc;
using WeeklyPlanner.API.DTOs;
using WeeklyPlanner.API.Helpers;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Infrastructure.Data;

namespace WeeklyPlanner.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanController : ControllerBase
{
    private readonly IPlanService _svc;
    private readonly AppDbContext _db;
     public PlanController(IPlanService svc, AppDbContext db)
    {
        _svc = svc;
        _db = db;
    }

    /// <summary>ADMIN - wipes all plans and entries (dev cleanup only).</summary>
[HttpDelete("admin/reset")]
public async Task<IActionResult> ResetAllPlans()
{
    var entries = _db.PlanEntries.ToList();
    var plans = _db.WeeklyPlans.ToList();
    _db.PlanEntries.RemoveRange(entries);
    _db.WeeklyPlans.RemoveRange(plans);
    await _db.SaveChangesAsync();
    return Ok(new { deleted = plans.Count, message = "All plans cleared." });
}

    [HttpGet("{memberId}/{weekCycleId}")]
    public async Task<IActionResult> GetPlan(int memberId, int weekCycleId)
    { var p = await _svc.GetPlanAsync(memberId, weekCycleId); return p is null ? NotFound() : Ok(p); }

    [HttpPost("submit")]
public async Task<IActionResult> Submit([FromBody] SubmitPlanDto dto)
{
    var entries = dto.Entries.Select(e => new WeeklyPlanner.Core.Models.PlanEntry
    {
        BacklogItemId = e.BacklogItemId,
        PlannedHours = e.PlannedHours,
        ProgressPercent = 0
    }).ToList();

    return Ok(await _svc.SubmitPlanAsync(dto.MemberId, dto.WeekCycleId, entries));
}

    [HttpPut("progress/{entryId}")]
    public async Task<IActionResult> UpdateProgress(int entryId, [FromBody] ProgressDto dto)
    { await _svc.UpdateProgressAsync(entryId, dto.ProgressPercent, dto.ActualHours); return NoContent(); }

    [HttpGet("week/{weekCycleId}/all")]
    public async Task<IActionResult> GetAllForWeek(int weekCycleId) =>
        Ok(await _svc.GetAllPlansForWeekAsync(weekCycleId));

    /// <summary>LEAD ONLY — aggregated dashboard for all members.</summary>
    [HttpGet("week/{weekCycleId}/dashboard")]
    public async Task<IActionResult> GetDashboard(int weekCycleId)
    {
        if (!RequestContext.IsLead(Request)) return Forbid();
        var plans = await _svc.GetAllPlansForWeekAsync(weekCycleId);
        var summary = plans.Select(p => new {
            MemberName      = p.Member.Name,
            p.IsFrozen,
            TotalTasks      = p.PlanEntries.Count,
            TotalPlannedHrs = p.PlanEntries.Sum(e => e.PlannedHours),
            TotalActualHrs  = p.PlanEntries.Sum(e => e.ActualHours ?? 0),
            OverallProgress = p.PlanEntries.Any()
                ? Math.Round(p.PlanEntries.Average(e => e.ProgressPercent), 1) : 0,
            Tasks = p.PlanEntries.Select(e => new {
                e.BacklogItem.Title, e.BacklogItem.Category,
                e.PlannedHours, e.ProgressPercent, e.ActualHours, e.LastUpdated
            })
        });
        return Ok(summary);
    }

    /// <summary>ADMIN - clears a member's plan for a week (dev use only).</summary>
[HttpDelete("{memberId}/{weekCycleId}")]
public async Task<IActionResult> DeletePlan(int memberId, int weekCycleId)
{
    var plan = await _svc.DeletePlanAsync(memberId, weekCycleId);
    return plan ? NoContent() : NotFound();
}
}