using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Application.Features.Decks.DTOs;
using EffectiveLearn.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Features.Decks.Queries;

public record GetDecksQuery : IRequest<List<DeckDto>>;

public class GetDecksQueryHandler : IRequestHandler<GetDecksQuery, List<DeckDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDecksQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<DeckDto>> Handle(GetDecksQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var decks = await _context.Decks
            .AsNoTracking()
            .Where(d => !d.IsArchived)
            .Include(d => d.Flashcards)
            .OrderByDescending(d => d.CreatedAtUtc)
            .Select(d => new DeckDto
            {
                Id = d.Id,
                Title = d.Title,
                Description = d.Description,
                Category = d.Category,
                ColorHex = d.ColorHex,
                TotalCards = d.Flashcards.Count,
                DueCards = d.Flashcards.Count(c => c.NextReviewUtc == null || c.NextReviewUtc <= now),
                MasteryPercentage = d.Flashcards.Count == 0 
                    ? 0 
                    : Math.Round((double)d.Flashcards.Count(c => c.State == CardState.Mastered) / d.Flashcards.Count * 100, 1),
                CreatedAtUtc = d.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return decks;
    }
}
