using WeeklyPlanner.Core.Models;
namespace WeeklyPlanner.API.DTOs;

/// <summary>Payload when a member submits their weekly plan.</summary>
public class SubmitPlanDto
{
    public int MemberId { get; set; }
    public int WeekCycleId { get; set; }
    public List<PlanEntry> Entries { get; set; } = new();
}