using Microsoft.AspNetCore.Http;
using WeeklyPlanner.API.Helpers;
using Xunit;

namespace WeeklyPlanner.Tests;

public class RequestContextTests
{
    private static HttpRequest MakeRequest(string? isLead = null, string? memberId = null)
    {
        var ctx = new DefaultHttpContext();
        if (isLead != null) ctx.Request.Headers["X-Is-Lead"] = isLead;
        if (memberId != null) ctx.Request.Headers["X-Member-Id"] = memberId;
        return ctx.Request;
    }

    // ── IsLead ────────────────────────────────────────────────────────────────

    [Fact]
    public void IsLead_WithTrueLowercase_ReturnsTrue()
    {
        var request = MakeRequest(isLead: "true");
        Assert.True(RequestContext.IsLead(request));
    }

    [Fact]
    public void IsLead_WithTrueUppercase_ReturnsTrue()
    {
        var request = MakeRequest(isLead: "TRUE");
        Assert.True(RequestContext.IsLead(request));
    }

    [Fact]
    public void IsLead_WithTrueMixedCase_ReturnsTrue()
    {
        var request = MakeRequest(isLead: "True");
        Assert.True(RequestContext.IsLead(request));
    }

    [Fact]
    public void IsLead_WithFalse_ReturnsFalse()
    {
        var request = MakeRequest(isLead: "false");
        Assert.False(RequestContext.IsLead(request));
    }

    [Fact]
    public void IsLead_WithMissingHeader_ReturnsFalse()
    {
        var request = MakeRequest(); // no header
        Assert.False(RequestContext.IsLead(request));
    }

    [Fact]
    public void IsLead_WithRandomString_ReturnsFalse()
    {
        var request = MakeRequest(isLead: "yes");
        Assert.False(RequestContext.IsLead(request));
    }

    [Fact]
    public void IsLead_WithEmptyString_ReturnsFalse()
    {
        var request = MakeRequest(isLead: "");
        Assert.False(RequestContext.IsLead(request));
    }

    // ── GetMemberId ───────────────────────────────────────────────────────────

    [Fact]
    public void GetMemberId_WithValidId_ReturnsId()
    {
        var request = MakeRequest(memberId: "2");
        Assert.Equal(2, RequestContext.GetMemberId(request));
    }

    [Fact]
    public void GetMemberId_WithMissingHeader_ReturnsNull()
    {
        var request = MakeRequest(); // no header
        Assert.Null(RequestContext.GetMemberId(request));
    }

    [Fact]
    public void GetMemberId_WithNonNumericValue_ReturnsNull()
    {
        var request = MakeRequest(memberId: "abc");
        Assert.Null(RequestContext.GetMemberId(request));
    }

    [Fact]
    public void GetMemberId_WithLeadId_ReturnsOne()
    {
        var request = MakeRequest(memberId: "1");
        Assert.Equal(1, RequestContext.GetMemberId(request));
    }

    [Fact]
    public void GetMemberId_WithEmptyString_ReturnsNull()
    {
        var request = MakeRequest(memberId: "");
        Assert.Null(RequestContext.GetMemberId(request));
    }
}