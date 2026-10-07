using EffectiveLearn.Domain.Common;
using EffectiveLearn.Domain.Enums;

namespace EffectiveLearn.Domain.Entities;

public class StudySessionLog : BaseEntity
{
    public Guid FlashcardId { get; set; }
    public Flashcard? Flashcard { get; set; }

    public ReviewRating Rating { get; set; }
    public int ResponseTimeMs { get; set; }
    public DateTime ReviewedAtUtc { get; set; } = DateTime.UtcNow;
}
