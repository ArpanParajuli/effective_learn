using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Deck> Decks { get; }
    DbSet<Flashcard> Flashcards { get; }
    DbSet<StudySessionLog> StudySessionLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
