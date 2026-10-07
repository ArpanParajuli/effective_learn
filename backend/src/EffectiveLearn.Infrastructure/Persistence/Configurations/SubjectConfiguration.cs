using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EffectiveLearn.Infrastructure.Persistence.Configurations;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("subjects");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(s => s.Slug)
            .IsRequired()
            .HasMaxLength(160);

        builder.Property(s => s.Description)
            .HasMaxLength(1000);

        builder.Property(s => s.Icon)
            .HasMaxLength(50);

        builder.HasIndex(s => s.Slug).IsUnique();

        builder.HasMany(s => s.Chapters)
            .WithOne(c => c.Subject)
            .HasForeignKey(c => c.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
