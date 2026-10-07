using FluentValidation;

namespace EffectiveLearn.Application.Features.Study.Commands;

public class RecordReviewCommandValidator : AbstractValidator<RecordReviewCommand>
{
    public RecordReviewCommandValidator()
    {
        RuleFor(v => v.FlashcardId)
            .NotEmpty().WithMessage("FlashcardId is required.");

        RuleFor(v => v.Rating)
            .IsInEnum().WithMessage("Invalid review rating specified.");

        RuleFor(v => v.ResponseTimeMs)
            .GreaterThanOrEqualTo(0).WithMessage("Response time cannot be negative.");
    }
}
