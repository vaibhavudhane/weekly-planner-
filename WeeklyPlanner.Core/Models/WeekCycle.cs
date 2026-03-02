namespace WeeklyPlanner.Core.Models;

/// <summary>
/// Represents one planning week cycle.
/// Planning happens on Tuesday. Work runs Wed through next Monday (4 days).
/// Lead sets Category1/2/3 percent — must sum to 100.
/// </summary>
public class WeekCycle
{
    public int Id { get; set; }
    public DateTime PlanningDate { get; set; }    // Tuesday
    public DateTime WeekStartDate { get; set; }   // Wednesday
    public DateTime WeekEndDate { get; set; }     // Monday
    public decimal Category1Percent { get; set; } // Client Focused %
    public decimal Category2Percent { get; set; } // Tech Debt %
    public decimal Category3Percent { get; set; } // R&D %
    public bool IsActive { get; set; } = true;
    public ICollection<WeeklyPlan> WeeklyPlans { get; set; } = new List<WeeklyPlan>();
}
