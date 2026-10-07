using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EffectiveLearn.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Subject> Subjects { get; }
    DbSet<Chapter> Chapters { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
