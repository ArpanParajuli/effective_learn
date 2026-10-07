using EffectiveLearn.Application.Features.Subjects.Commands;
using Xunit;

namespace EffectiveLearn.UnitTests;

public class SubjectValidationTests
{
    private readonly CreateSubjectCommandValidator _validator = new();

    [Fact]
    public void Validate_WhenTitleIsEmpty_ShouldFailValidation()
    {
        var command = new CreateSubjectCommand("", "Description", "BookOpen");
        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateSubjectCommand.Title));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPassValidation()
    {
        var command = new CreateSubjectCommand("System Design", "Scalability and microservices notes", "Layers");
        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
