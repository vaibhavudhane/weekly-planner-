using Microsoft.AspNetCore.Mvc;
using WeeklyPlanner.API.DTOs;
using WeeklyPlanner.API.Helpers;
using WeeklyPlanner.Core.Interfaces;

namespace WeeklyPlanner.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanController : ControllerBase
{
    private readonly IPlanService _svc;
    public PlanController(IPlanService svc) => _svc = svc;

    [HttpGet("{memberId}/{weekCycleId}")]
    public async Task<IActionResult> GetPlan(int memberId, int weekCycleId)
    { var p = await _svc.GetPlanAsync(memberId, weekCycleId); return p is null ? NotFound() : Ok(p); }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitPlanDto dto) =>
        Ok(await _svc.SubmitPlanAsync(dto.MemberId, dto.WeekCycleId, dto.Entries));

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
}