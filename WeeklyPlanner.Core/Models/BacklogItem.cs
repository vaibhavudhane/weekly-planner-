namespace WeeklyPlanner.Core.Models;

/// <summary>
/// A task in the product backlog.
/// Category 1 = Client Focused | 2 = Tech Debt | 3 = R&D
/// IsActive = false means soft-deleted (history preserved).
/// </summary>
public class BacklogItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Category { get; set; }  // 1, 2, or 3
    public bool IsActive { get; set; } = true;
    public ICollection<PlanEntry> PlanEntries { get; set; } = new List<PlanEntry>();
}
