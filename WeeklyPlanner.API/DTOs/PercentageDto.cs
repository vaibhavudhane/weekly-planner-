namespace WeeklyPlanner.API.DTOs;

/// <summary>Sent by lead to set category percentages for a week.</summary>
public class PercentageDto
{
    public decimal Cat1 { get; set; }
    public decimal Cat2 { get; set; }
    public decimal Cat3 { get; set; }
}