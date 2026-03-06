using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Middleware;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection") ??
    builder.Configuration["SQLAZURECONNSTR_DefaultConnection"];

Console.WriteLine("DB CONNECTION: " + connectionString);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Services
builder.Services.AddScoped<IBacklogService, BacklogService>();
builder.Services.AddScoped<IWeekCycleService, WeekCycleService>();
builder.Services.AddScoped<IPlanService, PlanService>();

// Controllers + Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "Weekly Planner API", Version = "v1" }));

// CORS
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(
        "http://localhost:4200",
        "https://localhost:4200",
        "https://YOUR-APP.azurestaticapps.net"
    ).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.MapControllers();

app.Run();
