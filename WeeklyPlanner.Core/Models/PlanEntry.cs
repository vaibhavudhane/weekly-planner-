namespace WeeklyPlanner.Core.Models;

/// <summary>
/// One backlog item inside a member's weekly plan.
/// PlannedHours: committed hours (enforced against category % limit).
/// ProgressPercent: 0–100, updated after freeze.
/// ActualHours: optional actual time spent (updated after freeze).
/// </summary>
public class PlanEntry
{
    public int Id { get; set; }
    public int WeeklyPlanId { get; set; }
    public WeeklyPlan WeeklyPlan { get; set; } = null!;
    public int BacklogItemId { get; set; }
    public BacklogItem BacklogItem { get; set; } = null!;
    public decimal PlannedHours { get; set; }
    public decimal ProgressPercent { get; set; } = 0;
    public decimal? ActualHours { get; set; }
    public DateTime? LastUpdated { get; set; }
}
