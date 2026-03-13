using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Middleware;
using WeeklyPlanner.Core.Interfaces;
using WeeklyPlanner.Infrastructure.Data;
using WeeklyPlanner.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ---------------- DATABASE CONNECTION ----------------

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection") ??
    builder.Configuration["SQLAZURECONNSTR_DefaultConnection"];

if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("Database connection string not found.");
}

Console.WriteLine("DB CONNECTION FOUND");

// Register DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));


// ---------------- SERVICES ----------------

builder.Services.AddScoped<IBacklogService, BacklogService>();
builder.Services.AddScoped<IWeekCycleService, WeekCycleService>();
builder.Services.AddScoped<IPlanService, PlanService>();


// ---------------- CONTROLLERS ----------------

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });


// ---------------- SWAGGER ----------------

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "Weekly Planner API", Version = "v1" }));


// ---------------- CORS ----------------

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "https://localhost:4200",
            "https://kind-flower-09f143d00.1.azurestaticapps.net",
            "https://agreeable-hill-0f22b4400.4.azurestaticapps.net"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});


// ---------------- BUILD APP ----------------

var app = builder.Build();


// ---------------- APPLY DATABASE MIGRATIONS ----------------

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}


// ---------------- MIDDLEWARE PIPELINE ----------------

app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

app.MapControllers();

app.Run();
