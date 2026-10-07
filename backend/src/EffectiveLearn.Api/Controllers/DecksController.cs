using EffectiveLearn.Application.Features.Decks.Commands;
using EffectiveLearn.Application.Features.Decks.DTOs;
using EffectiveLearn.Application.Features.Decks.Queries;
using Microsoft.AspNetCore.Mvc;

namespace EffectiveLearn.Api.Controllers;

public class DecksController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<DeckDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DeckDto>>> GetDecks()
    {
        var result = await Mediator.Send(new GetDecksQuery());
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CreateDeck([FromBody] CreateDeckCommand command)
    {
        var deckId = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetDecks), new { id = deckId }, deckId);
    }
}
