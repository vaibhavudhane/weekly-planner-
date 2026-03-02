using WeeklyPlanner.Core.Models;
namespace WeeklyPlanner.Core.Interfaces;
public interface IPlanService
{
    Task<WeeklyPlan?> GetPlanAsync(int memberId, int weekCycleId);
    Task<WeeklyPlan> SubmitPlanAsync(int memberId, int weekCycleId, List<PlanEntry> entries);
    Task UpdateProgressAsync(int planEntryId, decimal progressPercent, decimal? actualHours);
    Task<IEnumerable<WeeklyPlan>> GetAllPlansForWeekAsync(int weekCycleId);
}
