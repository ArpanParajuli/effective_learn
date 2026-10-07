using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EffectiveLearn.Infrastructure.Persistence.Configurations;

public class ChapterConfiguration : IEntityTypeConfiguration<Chapter>
{
    public void Configure(EntityTypeBuilder<Chapter> builder)
    {
        builder.ToTable("chapters");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Slug)
            .IsRequired()
            .HasMaxLength(210);

        builder.Property(c => c.Summary)
            .HasMaxLength(1000);

        builder.Property(c => c.Content)
            .IsRequired();

        builder.HasIndex(c => c.SubjectId);
        builder.HasIndex(c => new { c.SubjectId, c.OrderIndex });
    }
}
