using EffectiveLearn.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EffectiveLearn.Infrastructure.Persistence.Configurations;

public class DeckConfiguration : IEntityTypeConfiguration<Deck>
{
    public void Configure(EntityTypeBuilder<Deck> builder)
    {
        builder.ToTable("decks");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(d => d.Description)
            .HasMaxLength(1000);

        builder.Property(d => d.Category)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(d => d.ColorHex)
            .HasMaxLength(10);

        builder.HasMany(d => d.Flashcards)
            .WithOne(c => c.Deck)
            .HasForeignKey(c => c.DeckId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
