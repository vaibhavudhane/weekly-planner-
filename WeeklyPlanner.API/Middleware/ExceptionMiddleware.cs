using System.Net;
using System.Text.Json;

namespace WeeklyPlanner.API.Middleware;

/// <summary>
/// Global exception handler. Catches all unhandled exceptions and
/// returns a consistent JSON error response. No try/catch needed in controllers.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    { _next = next; _logger = logger; }

    public async Task InvokeAsync(HttpContext context)
    {
        try { await _next(context); }
        catch (ArgumentException ex)
        { _logger.LogWarning(ex, "Validation error"); await Write(context, HttpStatusCode.BadRequest, ex.Message); }
        catch (KeyNotFoundException ex)
        { _logger.LogWarning(ex, "Not found"); await Write(context, HttpStatusCode.NotFound, ex.Message); }
        catch (InvalidOperationException ex)
        { _logger.LogWarning(ex, "Business rule violation"); await Write(context, HttpStatusCode.Conflict, ex.Message); }
        catch (Exception ex)
        { _logger.LogError(ex, "Server error"); await Write(context, HttpStatusCode.InternalServerError, "An unexpected error occurred."); }
    }

    private static async Task Write(HttpContext ctx, HttpStatusCode status, string msg)
    {
        ctx.Response.StatusCode = (int)status;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync(
            JsonSerializer.Serialize(new { error = msg, statusCode = (int)status }));
    }
}