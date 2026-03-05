namespace WeeklyPlanner.API.DTOs;

/// <summary>Payload when a member submits their weekly plan.</summary>
public class SubmitPlanDto
{
    public int MemberId { get; set; }
    public int WeekCycleId { get; set; }
    public List<PlanEntryDto> Entries { get; set; } = new();
}

/// <summary>Clean DTO for a single plan entry — avoids EF tracking issues.</summary>
public class PlanEntryDto
{
    public int BacklogItemId { get; set; }
    public decimal PlannedHours { get; set; }
}