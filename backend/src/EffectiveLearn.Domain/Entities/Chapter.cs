using EffectiveLearn.Domain.Common;

namespace EffectiveLearn.Domain.Entities;

public class Chapter : BaseEntity
{
    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    
    /// <summary>
    /// Rich Markdown content containing embedded links, video players, and website bookmarks.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    public int OrderIndex { get; set; } = 0;
    public int EstimatedMinutes { get; set; } = 5;
    public bool IsPublished { get; set; } = true;
}
