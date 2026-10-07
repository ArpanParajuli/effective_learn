using EffectiveLearn.Api.Middleware;
using EffectiveLearn.Application;
using EffectiveLearn.Infrastructure;
using EffectiveLearn.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Serilog for structured production logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Register Application and Infrastructure layers
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 3. Add Controllers, OpenAPI, and Upload Limits (150 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 157_286_400; // 150 MB
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 157_286_400; // 150 MB
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 4. Configure Health Checks for database and live probe
var dbConn = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? builder.Configuration["DATABASE_CONNECTION_STRING"];

var healthCheckBuilder = builder.Services.AddHealthChecks();
if (!string.IsNullOrEmpty(dbConn))
{
    healthCheckBuilder.AddNpgSql(dbConn, name: "postgresql", tags: new[] { "db", "ready" });
}

// 5. Configure CORS
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:8080" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("EffectiveLearnPolicy", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 6. Global Exception Handling Middleware (RFC 7807)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 7. Auto-setup database schema and seed sample data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
            var logger = services.GetRequiredService<ILogger<Program>>();
            await ApplicationDbContextSeed.SeedSampleDataAsync(context, logger);
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed: {Message}", ex.Message);
    }
}

// 8. HTTP Pipeline configuration
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSerilogRequestLogging();
app.UseCors("EffectiveLearnPolicy");

app.UseRouting();
app.UseAuthorization();

// 9. Health Check Probes
app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

app.MapControllers();

app.Run();

// Make Program public for integration test fixtures
public partial class Program { }
