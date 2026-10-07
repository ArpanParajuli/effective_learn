using EffectiveLearn.Application.Common.Exceptions;
using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Features.Chapters.Commands;

public record CreateChapterCommand(
    Guid SubjectId,
    string Title,
    string Summary,
    string Content,
    int OrderIndex = 0,
    int EstimatedMinutes = 5,
    bool IsPublished = true
) : IRequest<Guid>;

public class CreateChapterCommandValidator : AbstractValidator<CreateChapterCommand>
{
    public CreateChapterCommandValidator()
    {
        RuleFor(x => x.SubjectId)
            .NotEmpty().WithMessage("Subject ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Chapter title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Chapter content cannot be empty.");
    }
}

public class CreateChapterCommandHandler : IRequestHandler<CreateChapterCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateChapterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateChapterCommand request, CancellationToken cancellationToken)
    {
        var subjectExists = await _context.Subjects
            .AnyAsync(s => s.Id == request.SubjectId, cancellationToken);

        if (!subjectExists)
        {
            throw new NotFoundException(nameof(Subject), request.SubjectId);
        }

        var chapter = new Chapter
        {
            SubjectId = request.SubjectId,
            Title = request.Title.Trim(),
            Slug = GenerateSlug(request.Title),
            Summary = request.Summary?.Trim() ?? string.Empty,
            Content = request.Content,
            OrderIndex = request.OrderIndex,
            EstimatedMinutes = Math.Max(1, request.EstimatedMinutes),
            IsPublished = request.IsPublished,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Chapters.Add(chapter);
        await _context.SaveChangesAsync(cancellationToken);

        return chapter.Id;
    }

    private static string GenerateSlug(string text)
    {
        return text.Trim().ToLowerInvariant()
            .Replace(" ", "-")
            .Replace(".", "")
            .Replace("/", "-");
    }
}

public record UpdateChapterCommand(
    Guid Id,
    string Title,
    string Summary,
    string Content,
    int OrderIndex,
    int EstimatedMinutes,
    bool IsPublished
) : IRequest<bool>;

public class UpdateChapterCommandValidator : AbstractValidator<UpdateChapterCommand>
{
    public UpdateChapterCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty();
    }
}

public class UpdateChapterCommandHandler : IRequestHandler<UpdateChapterCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateChapterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateChapterCommand request, CancellationToken cancellationToken)
    {
        var chapter = await _context.Chapters
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (chapter == null)
        {
            throw new NotFoundException(nameof(Chapter), request.Id);
        }

        chapter.Title = request.Title.Trim();
        chapter.Summary = request.Summary?.Trim() ?? string.Empty;
        chapter.Content = request.Content;
        chapter.OrderIndex = request.OrderIndex;
        chapter.EstimatedMinutes = Math.Max(1, request.EstimatedMinutes);
        chapter.IsPublished = request.IsPublished;
        chapter.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
