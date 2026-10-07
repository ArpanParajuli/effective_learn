using EffectiveLearn.Domain.Common;

namespace EffectiveLearn.Domain.Entities;

public class Deck : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string ColorHex { get; set; } = "#6366f1";
    public bool IsArchived { get; set; } = false;

    public ICollection<Flashcard> Flashcards { get; set; } = new List<Flashcard>();
}
