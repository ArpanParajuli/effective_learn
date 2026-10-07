using EffectiveLearn.Application.Common.Interfaces;
using EffectiveLearn.Application.Features.Subjects.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Features.Subjects.Queries;

public record GetSubjectsQuery : IRequest<List<SubjectDto>>;

public class GetSubjectsQueryHandler : IRequestHandler<GetSubjectsQuery, List<SubjectDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSubjectsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SubjectDto>> Handle(GetSubjectsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Subjects
            .AsNoTracking()
            .Include(s => s.Chapters)
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Title)
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                Title = s.Title,
                Slug = s.Slug,
                Description = s.Description,
                Icon = s.Icon,
                DisplayOrder = s.DisplayOrder,
                ChapterCount = s.Chapters.Count(c => c.IsPublished),
                CreatedAtUtc = s.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }
}
