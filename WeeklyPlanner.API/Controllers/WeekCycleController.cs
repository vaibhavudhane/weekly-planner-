using Microsoft.AspNetCore.Mvc;
using WeeklyPlanner.API.DTOs;
using WeeklyPlanner.API.Helpers;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Core.Models;

namespace WeeklyPlanner.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeekCycleController : ControllerBase
{
    private readonly IWeekCycleService _svc;
    public WeekCycleController(IWeekCycleService svc) => _svc = svc;

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent()
    { var c = await _svc.GetCurrentAsync(); return c is null ? NotFound() : Ok(c); }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create(WeekCycle c) => Ok(await _svc.CreateAsync(c));

    /// <summary>LEAD ONLY — sets category percentages for a week.</summary>
    [HttpPut("{id}/percentages")]
    public async Task<IActionResult> SetPercentages(int id, [FromBody] PercentageDto dto)
    {
        if (!RequestContext.IsLead(Request)) return Forbid();
        await _svc.SetPercentagesAsync(id, dto.Cat1, dto.Cat2, dto.Cat3);
        return NoContent();
    }
}