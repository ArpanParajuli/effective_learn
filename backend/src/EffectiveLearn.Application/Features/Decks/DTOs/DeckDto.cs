namespace EffectiveLearn.Application.Features.Decks.DTOs;

public class DeckDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ColorHex { get; set; } = string.Empty;
    public int TotalCards { get; set; }
    public int DueCards { get; set; }
    public double MasteryPercentage { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class FlashcardDto
{
    public Guid Id { get; set; }
    public Guid DeckId { get; set; }
    public string Front { get; set; } = string.Empty;
    public string Back { get; set; } = string.Empty;
    public string? KeyInsight { get; set; }
    public string? Hint { get; set; }
    public int Repetitions { get; set; }
    public int IntervalDays { get; set; }
    public DateTime? NextReviewUtc { get; set; }
    public string State { get; set; } = string.Empty;
}
