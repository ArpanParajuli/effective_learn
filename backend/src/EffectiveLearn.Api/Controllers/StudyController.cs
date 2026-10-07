using EffectiveLearn.Application.Features.Study.Commands;
using Microsoft.AspNetCore.Mvc;

namespace EffectiveLearn.Api.Controllers;

public class StudyController : ApiControllerBase
{
    [HttpPost("review")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordReview([FromBody] RecordReviewCommand command)
    {
        await Mediator.Send(command);
        return Ok(new { success = true, message = "Review recorded and SRS interval updated." });
    }
}
