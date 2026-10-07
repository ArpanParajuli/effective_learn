using EffectiveLearn.Domain.Entities;
using EffectiveLearn.Domain.Enums;
using Xunit;

namespace EffectiveLearn.UnitTests;

public class FlashcardTests
{
    [Fact]
    public void ApplyReviewRating_WhenRatedAgain_ResetsRepetitionsAndSetsIntervalToOne()
    {
        // Arrange
        var card = new Flashcard
        {
            Front = "Sample Question",
            Back = "Sample Answer",
            Repetitions = 3,
            IntervalDays = 10,
            EaseFactor = 2.5
        };

        // Act
        card.ApplyReviewRating(ReviewRating.Again, 450);

        // Assert
        Assert.Equal(0, card.Repetitions);
        Assert.Equal(1, card.IntervalDays);
        Assert.Equal(CardState.Learning, card.State);
        Assert.Single(card.SessionLogs);
        Assert.Equal(450, card.SessionLogs.First().ResponseTimeMs);
    }

    [Fact]
    public void ApplyReviewRating_WhenRatedGood_IncrementsRepetitionsAndScalesInterval()
    {
        // Arrange
        var card = new Flashcard
        {
            Front = "Sample Question",
            Back = "Sample Answer",
            Repetitions = 0,
            IntervalDays = 0,
            EaseFactor = 2.5
        };

        // Act - First successful review
        card.ApplyReviewRating(ReviewRating.Good, 600);

        // Assert
        Assert.Equal(1, card.Repetitions);
        Assert.Equal(1, card.IntervalDays);

        // Act - Second successful review
        card.ApplyReviewRating(ReviewRating.Good, 500);

        // Assert
        Assert.Equal(2, card.Repetitions);
        Assert.Equal(3, card.IntervalDays);
    }
}
