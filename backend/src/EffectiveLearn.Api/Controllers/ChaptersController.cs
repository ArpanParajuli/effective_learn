using EffectiveLearn.Application.Features.Chapters.Commands;
using EffectiveLearn.Application.Features.Chapters.DTOs;
using EffectiveLearn.Application.Features.Chapters.Queries;
using Microsoft.AspNetCore.Mvc;

namespace EffectiveLearn.Api.Controllers;

public class ChaptersController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<ChapterSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ChapterSummaryDto>>> GetAllChapters()
    {
        var result = await Mediator.Send(new GetAllChaptersQuery());
        return Ok(result);
    }

    [HttpGet("by-subject/{subjectId:guid}")]
    [ProducesResponseType(typeof(List<ChapterSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ChapterSummaryDto>>> GetBySubject(Guid subjectId)
    {
        var result = await Mediator.Send(new GetChaptersBySubjectQuery(subjectId));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ChapterDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChapterDetailDto>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetChapterByIdQuery(id));
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CreateChapter([FromBody] CreateChapterCommand command)
    {
        var id = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateChapter(Guid id, [FromBody] UpdateChapterCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest("Mismatched chapter identifier.");
        }

        await Mediator.Send(command);
        return NoContent();
    }
}
