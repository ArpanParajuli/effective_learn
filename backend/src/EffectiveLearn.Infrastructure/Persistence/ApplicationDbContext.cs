using System.Reflection;
using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Deck> Decks => Set<Deck>();
    public DbSet<Flashcard> Flashcards => Set<Flashcard>();
    public DbSet<StudySessionLog> StudySessionLogs => Set<StudySessionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
