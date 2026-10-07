using EffectiveLearn.Domain.Common;

namespace EffectiveLearn.Domain.Entities;

public class Subject : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "BookOpen";
    public int DisplayOrder { get; set; } = 0;

    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
}
