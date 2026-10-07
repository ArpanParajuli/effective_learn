using EffectiveLearn.Domain.Entities;
using EffectiveLearn.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EffectiveLearn.Infrastructure.Persistence;

public static class ApplicationDbContextSeed
{
    public static async Task SeedSampleDataAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Decks.AnyAsync())
        {
            return;
        }

        logger.LogInformation("Seeding initial EffectiveLearn decks and flashcards...");

        var dotnetDeck = new Deck
        {
            Title = "ASP.NET Core 10 Internals & GC",
            Description = "Memory models, non-allocating patterns, middleware pipeline, and Kestrel tuning.",
            Category = "Backend",
            ColorHex = "#6366f1",
            Flashcards = new List<Flashcard>
            {
                new()
                {
                    Front = "What is the primary architectural advantage of Endpoint Routing in ASP.NET Core?",
                    Back = "Endpoint routing decouples route matching from dispatching, allowing middleware to inspect endpoint metadata before the handler runs.",
                    KeyInsight = "Examine HttpContext.GetEndpoint() in custom middleware before endpoint execution.",
                    State = CardState.Learning,
                    EaseFactor = 2.5,
                    IntervalDays = 1,
                    NextReviewUtc = DateTime.UtcNow
                },
                new()
                {
                    Front = "What is the difference between ArrayPool<T>.Shared and standard GC heap allocation?",
                    Back = "ArrayPool rents reusable memory buffers without triggering garbage collection pressure or Generation 2 Large Object Heap (LOH) fragmentation.",
                    KeyInsight = "Always return rented buffers in a finally block to prevent memory leaks.",
                    State = CardState.New,
                    EaseFactor = 2.5,
                    IntervalDays = 0,
                    NextReviewUtc = DateTime.UtcNow
                }
            }
        };

        var postgresDeck = new Deck
        {
            Title = "PostgreSQL Indexing & Optimization",
            Description = "B-Tree, GIN, BRIN indexes, EXPLAIN ANALYZE interpretation, and vacuum tuning.",
            Category = "Database",
            ColorHex = "#06b6d4",
            Flashcards = new List<Flashcard>
            {
                new()
                {
                    Front = "When should a BRIN index be preferred over a B-Tree index in PostgreSQL?",
                    Back = "BRIN is best suited for massive append-only tables where data is physically ordered, producing orders of magnitude smaller index footprint.",
                    KeyInsight = "Ideal for time-series logs and audit tables.",
                    State = CardState.Review,
                    EaseFactor = 2.6,
                    IntervalDays = 3,
                    NextReviewUtc = DateTime.UtcNow
                }
            }
        };

        context.Decks.AddRange(dotnetDeck, postgresDeck);
        await context.SaveChangesAsync(CancellationToken.None);

        logger.LogInformation("Initial seed data created successfully.");
    }
}
