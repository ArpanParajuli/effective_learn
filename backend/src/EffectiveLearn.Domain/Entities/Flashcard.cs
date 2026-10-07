using EffectiveLearn.Domain.Common;
using EffectiveLearn.Domain.Enums;

namespace EffectiveLearn.Domain.Entities;

public class Flashcard : BaseEntity
{
    public Guid DeckId { get; set; }
    public Deck? Deck { get; set; }

    public string Front { get; set; } = string.Empty;
    public string Back { get; set; } = string.Empty;
    public string? KeyInsight { get; set; }
    public string? Hint { get; set; }

    // SuperMemo-2 (SM-2) parameters
    public double EaseFactor { get; set; } = 2.5;
    public int Repetitions { get; set; } = 0;
    public int IntervalDays { get; set; } = 0;
    public DateTime? NextReviewUtc { get; set; } = DateTime.UtcNow;
    public CardState State { get; set; } = CardState.New;

    public ICollection<StudySessionLog> SessionLogs { get; set; } = new List<StudySessionLog>();

    /// <summary>
    /// Applies the SuperMemo SM-2 algorithm to update scheduling intervals.
    /// </summary>
    public void ApplyReviewRating(ReviewRating rating, int responseTimeMs)
    {
        var q = (int)rating; // 1 to 4 mapping

        if (q < 2) // Rating 1: Again (failure)
        {
            Repetitions = 0;
            IntervalDays = 1;
            State = CardState.Learning;
        }
        else
        {
            if (Repetitions == 0)
            {
                IntervalDays = 1;
            }
            else if (Repetitions == 1)
            {
                IntervalDays = 3;
            }
            else
            {
                IntervalDays = (int)Math.Round(IntervalDays * EaseFactor);
            }

            Repetitions++;
            State = IntervalDays > 21 ? CardState.Mastered : CardState.Review;
        }

        // Adjust Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        // Mapping rating 1-4 to standard 5-point scale (q_scaled = q + 1)
        int qScaled = q + 1;
        EaseFactor = Math.Max(1.3, EaseFactor + (0.1 - (5 - qScaled) * (0.08 + (5 - qScaled) * 0.02)));

        NextReviewUtc = DateTime.UtcNow.AddDays(IntervalDays);
        UpdatedAtUtc = DateTime.UtcNow;

        SessionLogs.Add(new StudySessionLog
        {
            FlashcardId = Id,
            Rating = rating,
            ResponseTimeMs = responseTimeMs,
            ReviewedAtUtc = DateTime.UtcNow
        });
    }
}
