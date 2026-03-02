namespace WeeklyPlanner.API.Helpers;

/// <summary>
/// Reads role headers sent by the Angular RoleInterceptor.
/// Used to enforce lead-only API endpoints server-side.
/// </summary>
public static class RequestContext
{
    public static bool IsLead(HttpRequest request) =>
        request.Headers.TryGetValue("X-Is-Lead", out var val)
        && val.ToString().Equals("true", StringComparison.OrdinalIgnoreCase);

    public static int? GetMemberId(HttpRequest request) =>
        request.Headers.TryGetValue("X-Member-Id", out var val)
        && int.TryParse(val, out var id) ? id : null;
}