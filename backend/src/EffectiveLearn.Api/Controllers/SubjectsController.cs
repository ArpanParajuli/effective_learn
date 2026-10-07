using EffectiveLearn.Application.Features.Subjects.Commands;
using EffectiveLearn.Application.Features.Subjects.DTOs;
using EffectiveLearn.Application.Features.Subjects.Queries;
using Microsoft.AspNetCore.Mvc;

namespace EffectiveLearn.Api.Controllers;

public class SubjectsController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<SubjectDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SubjectDto>>> GetSubjects()
    {
        var result = await Mediator.Send(new GetSubjectsQuery());
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CreateSubject([FromBody] CreateSubjectCommand command)
    {
        var id = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetSubjects), new { id }, id);
    }
}
