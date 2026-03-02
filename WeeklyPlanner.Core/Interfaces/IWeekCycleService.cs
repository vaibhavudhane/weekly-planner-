using WeeklyPlanner.Core.Models;
namespace WeeklyPlanner.Core.Interfaces;
public interface IWeekCycleService
{
    Task<WeekCycle?> GetCurrentAsync();
    Task<IEnumerable<WeekCycle>> GetAllAsync();
    Task<WeekCycle> CreateAsync(WeekCycle cycle);
    Task SetPercentagesAsync(int weekCycleId, decimal cat1, decimal cat2, decimal cat3);
}
