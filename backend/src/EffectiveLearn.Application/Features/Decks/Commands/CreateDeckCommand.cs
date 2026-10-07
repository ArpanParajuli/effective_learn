using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Domain.Entities;
using MediatR;

namespace EffectiveLearn.Application.Features.Decks.Commands;

public record CreateDeckCommand(
    string Title,
    string Description,
    string Category,
    string? ColorHex
) : IRequest<Guid>;

public class CreateDeckCommandHandler : IRequestHandler<CreateDeckCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateDeckCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateDeckCommand request, CancellationToken cancellationToken)
    {
        var deck = new Deck
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            ColorHex = string.IsNullOrWhiteSpace(request.ColorHex) ? "#6366f1" : request.ColorHex.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Decks.Add(deck);
        await _context.SaveChangesAsync(cancellationToken);

        return deck.Id;
    }
}
