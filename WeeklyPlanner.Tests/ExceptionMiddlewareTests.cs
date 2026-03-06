using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using WeeklyPlanner.API.Middleware;
using Xunit;

namespace WeeklyPlanner.Tests;

public class ExceptionMiddlewareTests
{
    private static (ExceptionMiddleware middleware, HttpContext context) Setup(RequestDelegate next)
    {
        var logger = new Mock<ILogger<ExceptionMiddleware>>();
        var middleware = new ExceptionMiddleware(next, logger.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return (middleware, context);
    }

    private static async Task<(int statusCode, string body)> RunAndRead(
        ExceptionMiddleware middleware, HttpContext context)
    {
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        return (context.Response.StatusCode, body);
    }

    [Fact]
    public async Task InvokeAsync_NoException_PassesThrough()
    {
        RequestDelegate next = _ => Task.CompletedTask;
        var (middleware, context) = Setup(next);

        await middleware.InvokeAsync(context);

        // Default status is 200 when no exception and nothing sets it
        Assert.Equal(200, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ArgumentException_Returns400WithMessage()
    {
        RequestDelegate next = _ => throw new ArgumentException("Invalid input value");
        var (middleware, context) = Setup(next);

        var (status, body) = await RunAndRead(middleware, context);

        Assert.Equal(400, status);
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("Invalid input value", json.GetProperty("error").GetString());
        Assert.Equal(400, json.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_Returns404WithMessage()
    {
        RequestDelegate next = _ => throw new KeyNotFoundException("Item not found");
        var (middleware, context) = Setup(next);

        var (status, body) = await RunAndRead(middleware, context);

        Assert.Equal(404, status);
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("Item not found", json.GetProperty("error").GetString());
        Assert.Equal(404, json.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_InvalidOperationException_Returns409WithMessage()
    {
        RequestDelegate next = _ => throw new InvalidOperationException("Plan already exists");
        var (middleware, context) = Setup(next);

        var (status, body) = await RunAndRead(middleware, context);

        Assert.Equal(409, status);
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("Plan already exists", json.GetProperty("error").GetString());
        Assert.Equal(409, json.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_UnknownException_Returns500WithGenericMessage()
    {
        RequestDelegate next = _ => throw new Exception("Some unexpected crash");
        var (middleware, context) = Setup(next);

        var (status, body) = await RunAndRead(middleware, context);

        Assert.Equal(500, status);
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("An unexpected error occurred.", json.GetProperty("error").GetString());
        Assert.Equal(500, json.GetProperty("statusCode").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_SetsContentTypeToJson()
    {
        RequestDelegate next = _ => throw new ArgumentException("Bad input");
        var (middleware, context) = Setup(next);

        await middleware.InvokeAsync(context);

        Assert.Equal("application/json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_UnknownException_DoesNotLeakInternalMessage()
    {
        RequestDelegate next = _ => throw new Exception("Secret internal crash details");
        var (middleware, context) = Setup(next);

        var (_, body) = await RunAndRead(middleware, context);

        Assert.DoesNotContain("Secret internal crash details", body);
    }
}