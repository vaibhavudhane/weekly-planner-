namespace WeeklyPlanner.API.DTOs;

/// <summary>Payload to update progress on a single plan entry.</summary>
public class ProgressDto
{
    public decimal ProgressPercent { get; set; }
    public decimal? ActualHours { get; set; }
}