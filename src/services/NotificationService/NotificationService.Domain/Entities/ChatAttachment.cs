using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Represents a file attachment in a chat message.
/// Supports images, documents, code files, and archives.
/// </summary>
public class ChatAttachment : AuditableEntity
{
    /// <summary>
    /// The message this attachment belongs to
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string MessageId { get; set; } = string.Empty;

    /// <summary>
    /// The thread this attachment belongs to (denormalized for queries)
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string ThreadId { get; set; } = string.Empty;

    /// <summary>
    /// The user who uploaded this attachment
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string UploaderId { get; set; } = string.Empty;

    /// <summary>
    /// The uploader's display name
    /// </summary>
    [MaxLength(200)]
    public string? UploaderName { get; set; }

    /// <summary>
    /// Storage file name (GUID-based for security)
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Original file name as uploaded by the user
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// MIME type of the file
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string MimeType { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Display-friendly file size (e.g., "2.5 MB")
    /// </summary>
    [MaxLength(50)]
    public string? FileSizeDisplay { get; set; }

    /// <summary>
    /// Storage URL (Azure Blob, S3, etc.)
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string StorageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Thumbnail URL for images/videos/PDFs
    /// </summary>
    [MaxLength(1000)]
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Storage container/bucket name
    /// </summary>
    [MaxLength(100)]
    public string? StorageContainer { get; set; }

    /// <summary>
    /// Storage blob/key name
    /// </summary>
    [MaxLength(500)]
    public string? StorageBlobName { get; set; }

    /// <summary>
    /// Content hash for deduplication (SHA256)
    /// </summary>
    [MaxLength(64)]
    public string? ContentHash { get; set; }

    #region Image Metadata

    /// <summary>
    /// Image width in pixels
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Image height in pixels
    /// </summary>
    public int? Height { get; set; }

    #endregion

    #region Video Metadata

    /// <summary>
    /// Video duration in seconds
    /// </summary>
    public int? DurationSeconds { get; set; }

    #endregion

    #region Encryption

    /// <summary>
    /// Whether the file is encrypted
    /// </summary>
    public bool IsEncrypted { get; set; }

    /// <summary>
    /// Encryption key ID
    /// </summary>
    [MaxLength(450)]
    public string? EncryptionKeyId { get; set; }

    /// <summary>
    /// Initialization vector for encryption
    /// </summary>
    [MaxLength(100)]
    public string? EncryptionIV { get; set; }

    #endregion

    #region Virus Scan

    /// <summary>
    /// Whether the file has been scanned for viruses
    /// </summary>
    public bool IsScanned { get; set; }

    /// <summary>
    /// When the virus scan was completed
    /// </summary>
    public DateTime? ScannedAt { get; set; }

    /// <summary>
    /// Whether the file is clean (no viruses found)
    /// </summary>
    public bool? IsClean { get; set; }

    /// <summary>
    /// Virus scan result message
    /// </summary>
    [MaxLength(500)]
    public string? ScanResult { get; set; }

    #endregion

    /// <summary>
    /// When the file was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Number of times the file was downloaded
    /// </summary>
    public int DownloadCount { get; set; }

    /// <summary>
    /// When the file was last downloaded
    /// </summary>
    public DateTime? LastDownloadedAt { get; set; }

    /// <summary>
    /// When the file expires (for temporary files)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Navigation property to the message
    /// </summary>
    public virtual ChatMessage? Message { get; set; }

    /// <summary>
    /// Gets the file category based on MIME type
    /// </summary>
    public string GetFileCategory()
    {
        return MimeType.Split('/')[0] switch
        {
            "image" => "Image",
            "video" => "Video",
            "audio" => "Audio",
            "application" when MimeType.Contains("pdf") => "Document",
            "application" when MimeType.Contains("word") || MimeType.Contains("document") => "Document",
            "application" when MimeType.Contains("sheet") || MimeType.Contains("excel") => "Spreadsheet",
            "application" when MimeType.Contains("presentation") || MimeType.Contains("powerpoint") => "Presentation",
            "application" when MimeType.Contains("zip") || MimeType.Contains("rar") || MimeType.Contains("tar") => "Archive",
            "text" when MimeType.Contains("plain") || MimeType.Contains("json") || MimeType.Contains("xml") => "Code",
            _ => "File"
        };
    }

    /// <summary>
    /// Gets the file icon based on category
    /// </summary>
    public string GetFileIcon()
    {
        return GetFileCategory() switch
        {
            "Image" => "image",
            "Video" => "video_file",
            "Audio" => "audio_file",
            "Document" => "description",
            "Spreadsheet" => "table_chart",
            "Presentation" => "slideshow",
            "Archive" => "folder_zip",
            "Code" => "code",
            _ => "insert_drive_file"
        };
    }

    /// <summary>
    /// Formats file size for display
    /// </summary>
    public static string FormatFileSize(long bytes)
    {
        string[] suffixes = ["B", "KB", "MB", "GB", "TB"];
        int i = 0;
        double size = bytes;

        while (size >= 1024 && i < suffixes.Length - 1)
        {
            size /= 1024;
            i++;
        }

        return $"{size:0.##} {suffixes[i]}";
    }
}

/// <summary>
/// Allowed file types for chat attachments
/// </summary>
public static class ChatAllowedFileTypes
{
    public static readonly string[] Images = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    public static readonly string[] Videos = ["video/mp4", "video/webm", "video/quicktime"];
    public static readonly string[] Audio = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];
    public static readonly string[] Documents = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    public static readonly string[] Code = ["text/plain", "application/json", "text/xml", "text/html", "text/css", "text/javascript"];
    public static readonly string[] Archives = ["application/zip", "application/x-rar-compressed", "application/x-tar", "application/gzip"];

    public static readonly string[] All = [..Images, ..Videos, ..Audio, ..Documents, ..Code, ..Archives];

    public const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB
    public const long MaxImageSizeBytes = 10 * 1024 * 1024; // 10 MB
    public const long MaxVideoSizeBytes = 100 * 1024 * 1024; // 100 MB

    public static bool IsAllowed(string mimeType) => All.Contains(mimeType);
    public static bool IsImage(string mimeType) => Images.Contains(mimeType);
    public static bool IsVideo(string mimeType) => Videos.Contains(mimeType);
}
