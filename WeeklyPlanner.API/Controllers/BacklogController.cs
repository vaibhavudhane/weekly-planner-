using Microsoft.AspNetCore.Mvc;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;

namespace WeeklyPlanner.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BacklogController : ControllerBase
{
    private readonly IBacklogService _svc;
    public BacklogController(IBacklogService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(BacklogItem item) =>
        Ok(await _svc.CreateAsync(item));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, BacklogItem item)
    { item.Id = id; return Ok(await _svc.UpdateAsync(item)); }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    { await _svc.DeleteAsync(id); return NoContent(); }
}