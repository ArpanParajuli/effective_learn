using EffectiveLearn.Application.Features.Chapters.Commands;
using Xunit;

namespace EffectiveLearn.UnitTests;

public class ChapterValidationTests
{
    private readonly CreateChapterCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenTitleOrContentIsEmpty_ShouldFailValidation()
    {
        var command = new CreateChapterCommand(Guid.NewGuid(), "", "Summary", "");
        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateChapterCommand.Title));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateChapterCommand.Content));
    }

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldPassValidation()
    {
        var command = new CreateChapterCommand(
            Guid.NewGuid(),
            "Chapter 1: Clean Architecture",
            "Introductory chapter summary",
            "# Heading\n\nContent with [video:https://youtube.com/watch?v=123]"
        );
        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
