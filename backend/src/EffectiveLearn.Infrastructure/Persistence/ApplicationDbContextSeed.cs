using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EffectiveLearn.Infrastructure.Persistence;

public static class ApplicationDbContextSeed
{
    public static async Task SeedSampleDataAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Subjects.AnyAsync())
        {
            return;
        }

        logger.LogInformation("Seeding initial Subjects and Chapters for EffectiveLearn...");

        var dotnetSubject = new Subject
        {
            Title = "ASP.NET Core 10 Architecture",
            Slug = "aspnet-core-10-architecture",
            Description = "In-depth reference notes on modern .NET 10, clean architecture, and performance patterns.",
            Icon = "Server",
            DisplayOrder = 1,
            Chapters = new List<Chapter>
            {
                new()
                {
                    Title = "1. Clean Architecture & Project Decomposition",
                    Slug = "clean-architecture-and-project-decomposition",
                    Summary = "Structuring Domain, Application, Infrastructure, and Presentation layers for enterprise maintainability.",
                    OrderIndex = 1,
                    EstimatedMinutes = 8,
                    IsPublished = true,
                    Content = @"# Clean Architecture in Modern .NET 10

Clean Architecture separates domain business logic from database concerns, UI presentation, and third-party SDK dependencies.

## Key Principles

1. **Dependency Inversion**: Core domain layers do not depend on external databases.
2. **Explicit Interfaces**: The Application layer defines interfaces like `IApplicationDbContext`, which Infrastructure implements.
3. **CQRS with MediatR**: Segregating write operations (Commands) from read operations (Queries) simplifies caching and scaling.

### Video Guide
[video:https://www.youtube.com/watch?v=yF9SwL0p0Y0]

### Useful Documentation Link
- Read the official Microsoft Architecture Guide: [website:https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/]

```csharp
public class GetSubjectsQueryHandler : IRequestHandler<GetSubjectsQuery, List<SubjectDto>>
{
    private readonly IApplicationDbContext _context;
    public GetSubjectsQueryHandler(IApplicationDbContext context) => _context = context;
}
```
"
                },
                new()
                {
                    Title = "2. High-Performance Request Pipelines & Middleware",
                    Slug = "high-performance-request-pipelines",
                    Summary = "Understanding Kestrel pipeline execution, Endpoint Routing, and non-allocating memory patterns.",
                    OrderIndex = 2,
                    EstimatedMinutes = 6,
                    IsPublished = true,
                    Content = @"# High-Performance Request Pipelines

In ASP.NET Core, the request pipeline consists of an ordered sequence of middleware delegates.

## Middleware Order Matters

1. Exception Handling (catches errors from all downstream middleware)
2. HTTPS Redirection
3. Static Files & Routing
4. CORS Policy
5. Authentication & Authorization
6. Endpoint Execution

### Embedded Video Overview
[video:https://www.youtube.com/watch?v=d_k8k04nK_c]

### Related Resource
Check the documentation: [website:https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/]
"
                }
            }
        };

        var systemDesignSubject = new Subject
        {
            Title = "System Design & Distributed Systems",
            Slug = "system-design-distributed-systems",
            Description = "Concepts on scalability, message queues, databases, and microservices reliability.",
            Icon = "Layers",
            DisplayOrder = 2,
            Chapters = new List<Chapter>
            {
                new()
                {
                    Title = "1. Database Sharding vs Partitioning",
                    Slug = "database-sharding-vs-partitioning",
                    Summary = "Horizontal scaling techniques across PostgreSQL nodes and partition keys.",
                    OrderIndex = 1,
                    EstimatedMinutes = 7,
                    IsPublished = true,
                    Content = @"# Database Sharding vs Partitioning

When data volume exceeds the capacity of a single relational database instance, horizontal partitioning and sharding become essential.

## Differences
- **Partitioning**: Dividing tables into smaller chunks within the same database instance.
- **Sharding**: Distributing partitions across independent physical database servers.

### Video Tutorial
[video:https://www.youtube.com/watch?v=5faMjKuB9bc]
"
                }
            }
        };

        context.Subjects.AddRange(dotnetSubject, systemDesignSubject);
        await context.SaveChangesAsync(CancellationToken.None);

        logger.LogInformation("Sample subjects and chapters seeded successfully.");
    }
}
