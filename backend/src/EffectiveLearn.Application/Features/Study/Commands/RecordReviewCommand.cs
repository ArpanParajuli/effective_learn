using EffectiveLearn.Application.Common.Exceptions;
using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Domain.Entities;
using EffectiveLearn.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Features.Study.Commands;

public record RecordReviewCommand(
    Guid FlashcardId,
    ReviewRating Rating,
    int ResponseTimeMs
) : IRequest<bool>;

public class RecordReviewCommandHandler : IRequestHandler<RecordReviewCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public RecordReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RecordReviewCommand request, CancellationToken cancellationToken)
    {
        var card = await _context.Flashcards
            .Include(c => c.SessionLogs)
            .FirstOrDefaultAsync(c => c.Id == request.FlashcardId, cancellationToken);

        if (card == null)
        {
            throw new NotFoundException(nameof(Flashcard), request.FlashcardId);
        }

        card.ApplyReviewRating(request.Rating, request.ResponseTimeMs);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
