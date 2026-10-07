using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Domain.Entities;
using FluentValidation;
using MediatR;

namespace EffectiveLearn.Application.Features.Subjects.Commands;

public record CreateSubjectCommand(
    string Title,
    string Description,
    string? Icon,
    int DisplayOrder = 0
) : IRequest<Guid>;

public class CreateSubjectCommandValidator : AbstractValidator<CreateSubjectCommand>
{
    public CreateSubjectCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Subject title is required.")
            .MaximumLength(150).WithMessage("Title cannot exceed 150 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");
    }
}

public class CreateSubjectCommandHandler : IRequestHandler<CreateSubjectCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateSubjectCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateSubjectCommand request, CancellationToken cancellationToken)
    {
        var slug = GenerateSlug(request.Title);

        var subject = new Subject
        {
            Title = request.Title.Trim(),
            Slug = slug,
            Description = request.Description.Trim(),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "BookOpen" : request.Icon.Trim(),
            DisplayOrder = request.DisplayOrder,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync(cancellationToken);

        return subject.Id;
    }

    private static string GenerateSlug(string text)
    {
        return text.Trim().ToLowerInvariant()
            .Replace(" ", "-")
            .Replace(".", "")
            .Replace("/", "-");
    }
}
