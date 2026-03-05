using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Middleware;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Register Services (Dependency Injection) ──────────────────────────────
builder.Services.AddScoped<IBacklogService, BacklogService>();
builder.Services.AddScoped<IWeekCycleService, WeekCycleService>();
builder.Services.AddScoped<IPlanService, PlanService>();

// ── Controllers + Swagger ─────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = 
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "Weekly Planner API", Version = "v1" }));

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(
        "http://localhost:4200",
        "https://localhost:4200",
        "https://YOUR-APP.azurestaticapps.net"  // update on Day 4
    ).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// ── Auto-apply migrations on startup ──────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// ── Middleware pipeline — ORDER MATTERS ───────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();  // must be first
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.MapControllers();
app.Run();