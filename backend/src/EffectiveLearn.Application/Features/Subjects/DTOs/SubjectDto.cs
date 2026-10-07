namespace EffectiveLearn.Application.Features.Subjects.DTOs;

public class SubjectDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "BookOpen";
    public int DisplayOrder { get; set; }
    public int ChapterCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
