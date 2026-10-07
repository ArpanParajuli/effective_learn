using EffectiveLearn.Application.Features.Decks.Commands;
using Xunit;

namespace EffectiveLearn.UnitTests;

public class CreateDeckCommandValidatorTests
{
    private readonly CreateDeckCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenTitleIsEmpty_ShouldFailValidation()
    {
        // Arrange
        var command = new CreateDeckCommand("", "Valid description", "Backend", "#6366f1");

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateDeckCommand.Title));
    }

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldPassValidation()
    {
        // Arrange
        var command = new CreateDeckCommand("Distributed Systems", "Valid description", "Architecture", "#6366f1");

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.True(result.IsValid);
    }
}
