using FluentValidation;

namespace EffectiveLearn.Application.Features.Decks.Commands;

public class CreateDeckCommandValidator : AbstractValidator<CreateDeckCommand>
{
    public CreateDeckCommandValidator()
    {
        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Deck title cannot be empty.")
            .MaximumLength(150).WithMessage("Deck title cannot exceed 150 characters.");

        RuleFor(v => v.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");

        RuleFor(v => v.Category)
            .MaximumLength(50).WithMessage("Category cannot exceed 50 characters.");
    }
}
