using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace EffectiveLearn.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<MediaController> _logger;
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp"
    };

    private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".webm", ".mov", ".mkv", ".avi"
    };

    private const long MaxFileSizeBytes = 157_286_400; // 150 MB

    public MediaController(IWebHostEnvironment environment, ILogger<MediaController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileSizeBytes)]
    [ProducesResponseType(typeof(MediaUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadMedia(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid file",
                Detail = "Please provide a non-empty media file.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "File too large",
                Detail = $"File size exceeds the 150MB limit ({file.Length / (1024 * 1024)} MB).",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var isImage = AllowedImageExtensions.Contains(extension);
        var isVideo = AllowedVideoExtensions.Contains(extension);

        if (!isImage && !isVideo)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Unsupported file format",
                Detail = $"Extension '{extension}' is not supported. Supported image formats: png, jpg, jpeg, webp, gif, svg. Supported video formats: mp4, webm, mov, mkv.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        try
        {
            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueName = $"{Guid.NewGuid():N}{extension}";
            var destinationPath = Path.Combine(uploadsFolder, uniqueName);

            using (var stream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream);
            }

            if (!ContentTypeProvider.TryGetContentType(uniqueName, out var mimeType))
            {
                mimeType = isImage ? "image/jpeg" : "video/mp4";
            }

            var originalSafeName = Path.GetFileName(file.FileName);
            var mediaType = isImage ? "image" : "video";
            var relativeUrl = $"/api/media/file/{uniqueName}";

            _logger.LogInformation("Successfully uploaded media {OriginalName} as {UniqueName} ({Size} bytes)", originalSafeName, uniqueName, file.Length);

            return Ok(new MediaUploadResponse(
                Url: relativeUrl,
                FileName: originalSafeName,
                SavedFileName: uniqueName,
                ContentType: mimeType,
                SizeBytes: file.Length,
                MediaType: mediaType
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload media file {FileName}", file.FileName);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Upload failed",
                Detail = "An unexpected error occurred while saving the media file.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpGet("file/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public IActionResult GetMediaFile(string fileName)
    {
        // Sanitize to prevent path traversal
        var safeFileName = Path.GetFileName(fileName);
        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads");
        var filePath = Path.Combine(uploadsFolder, safeFileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new ProblemDetails
            {
                Title = "Media not found",
                Detail = $"File '{safeFileName}' was not found on this server.",
                Status = StatusCodes.Status404NotFound
            });
        }

        if (!ContentTypeProvider.TryGetContentType(filePath, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        // PhysicalFile with enableRangeProcessing: true allows video streaming and seeking (HTTP 206 Partial Content)
        Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
        return PhysicalFile(filePath, contentType, enableRangeProcessing: true);
    }
}

public record MediaUploadResponse(
    string Url,
    string FileName,
    string SavedFileName,
    string ContentType,
    long SizeBytes,
    string MediaType
);
