using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EffectiveLearn.Infrastructure.Persistence.Configurations;

public class FlashcardConfiguration : IEntityTypeConfiguration<Flashcard>
{
    public void Configure(EntityTypeBuilder<Flashcard> builder)
    {
        builder.ToTable("flashcards");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Front)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(c => c.Back)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(c => c.KeyInsight)
            .HasMaxLength(1000);

        builder.Property(c => c.Hint)
            .HasMaxLength(500);

        builder.HasIndex(c => c.NextReviewUtc);
        builder.HasIndex(c => c.DeckId);

        builder.HasMany(c => c.SessionLogs)
            .WithOne(l => l.Flashcard)
            .HasForeignKey(l => l.FlashcardId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
