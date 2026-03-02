using WeeklyPlanner.Core.Models;
namespace WeeklyPlanner.Core.Interfaces;
public interface IBacklogService
{
    Task<IEnumerable<BacklogItem>> GetAllAsync();
    Task<BacklogItem?> GetByIdAsync(int id);
    Task<BacklogItem> CreateAsync(BacklogItem item);
    Task<BacklogItem> UpdateAsync(BacklogItem item);
    Task DeleteAsync(int id);
}
