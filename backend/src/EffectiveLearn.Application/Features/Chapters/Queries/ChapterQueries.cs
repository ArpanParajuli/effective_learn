using EffectiveLearn.Application.Common.Exceptions;
using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Application.Features.Chapters.DTOs;
using EffectiveLearn.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Features.Chapters.Queries;

public record GetChaptersBySubjectQuery(Guid SubjectId) : IRequest<List<ChapterSummaryDto>>;

public class GetChaptersBySubjectQueryHandler : IRequestHandler<GetChaptersBySubjectQuery, List<ChapterSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetChaptersBySubjectQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChapterSummaryDto>> Handle(GetChaptersBySubjectQuery request, CancellationToken cancellationToken)
    {
        return await _context.Chapters
            .AsNoTracking()
            .Where(c => c.SubjectId == request.SubjectId && c.IsPublished)
            .OrderBy(c => c.OrderIndex)
            .ThenBy(c => c.CreatedAtUtc)
            .Select(c => new ChapterSummaryDto
            {
                Id = c.Id,
                SubjectId = c.SubjectId,
                Title = c.Title,
                Slug = c.Slug,
                Summary = c.Summary,
                OrderIndex = c.OrderIndex,
                EstimatedMinutes = c.EstimatedMinutes,
                IsPublished = c.IsPublished,
                CreatedAtUtc = c.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }
}

public record GetChapterByIdQuery(Guid Id) : IRequest<ChapterDetailDto>;

public class GetChapterByIdQueryHandler : IRequestHandler<GetChapterByIdQuery, ChapterDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetChapterByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChapterDetailDto> Handle(GetChapterByIdQuery request, CancellationToken cancellationToken)
    {
        var chapter = await _context.Chapters
            .AsNoTracking()
            .Include(c => c.Subject)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (chapter == null)
        {
            throw new NotFoundException(nameof(Chapter), request.Id);
        }

        return new ChapterDetailDto
        {
            Id = chapter.Id,
            SubjectId = chapter.SubjectId,
            SubjectTitle = chapter.Subject?.Title ?? string.Empty,
            Title = chapter.Title,
            Slug = chapter.Slug,
            Summary = chapter.Summary,
            Content = chapter.Content,
            OrderIndex = chapter.OrderIndex,
            EstimatedMinutes = chapter.EstimatedMinutes,
            IsPublished = chapter.IsPublished,
            CreatedAtUtc = chapter.CreatedAtUtc,
            UpdatedAtUtc = chapter.UpdatedAtUtc
        };
    }
}
