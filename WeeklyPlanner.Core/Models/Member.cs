namespace WeeklyPlanner.Core.Models;

/// <summary>
/// A team member or team lead.
/// IsLead = true grants access to set percentages and view all dashboards.
/// </summary>
public class Member
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsLead { get; set; } = false;
    public ICollection<WeeklyPlan> WeeklyPlans { get; set; } = new List<WeeklyPlan>();
}
