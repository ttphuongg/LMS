using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Library.Modules.Core.Catalog.Services;

public sealed class CloudflareR2StorageService : IStorageService
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<CloudflareR2StorageService> _logger;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    public CloudflareR2StorageService(
        IConfiguration config,
        IWebHostEnvironment env,
        ILogger<CloudflareR2StorageService> logger)
    {
        _config = config;
        _env = env;
        _logger = logger;
    }

    public async Task<string> UploadBookCoverAsync(IFormFile file, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Vui lòng chọn file ảnh để tải lên.");
        }

        if (file.Length > MaxFileSize)
        {
            throw new ArgumentException("Dung lượng file không được vượt quá 5MB.");
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            throw new ArgumentException("Chỉ chấp nhận các định dạng ảnh: .jpg, .jpeg, .png, .webp.");
        }

        var accountId = _config["CloudflareR2:AccountId"]?.Trim();
        var accessKey = _config["CloudflareR2:AccessKeyId"]?.Trim();
        var secretKey = _config["CloudflareR2:SecretAccessKey"]?.Trim();
        var bucketName = _config["CloudflareR2:BucketName"]?.Trim();
        var publicUrl = _config["CloudflareR2:PublicUrl"]?.Trim();

        if (string.IsNullOrWhiteSpace(publicUrl))
        {
            publicUrl = "https://images.libri.id.vn";
        }

        // Nếu đã điền đủ thông tin R2 trong .env -> Đẩy thẳng lên Cloudflare R2
        if (!string.IsNullOrWhiteSpace(accountId) &&
            !string.IsNullOrWhiteSpace(accessKey) &&
            !string.IsNullOrWhiteSpace(secretKey) &&
            !string.IsNullOrWhiteSpace(bucketName))
        {
            return await UploadToR2Async(file, ext, accountId, accessKey, secretKey, bucketName, publicUrl, ct);
        }

        // Fallback: Nếu chưa điền thông tin R2 -> Lưu tạm cục bộ vào wwwroot/book_covers
        _logger.LogWarning("[CloudflareR2] Chưa cấu hình đầy đủ R2 credentials trong .env. Lưu ảnh cục bộ tại wwwroot/book_covers.");
        return await UploadLocallyAsync(file, ext, ct);
    }

    private async Task<string> UploadToR2Async(
        IFormFile file,
        string ext,
        string accountId,
        string accessKey,
        string secretKey,
        string bucketName,
        string publicUrl,
        CancellationToken ct)
    {
        var s3Config = new AmazonS3Config
        {
            ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
            ForcePathStyle = true
        };

        var credentials = new BasicAWSCredentials(accessKey, secretKey);
        using var client = new AmazonS3Client(credentials, s3Config);

        var objectKey = $"covers/book_{Guid.NewGuid():N}{ext.ToLowerInvariant()}";

        using var stream = file.OpenReadStream();
        var putRequest = new PutObjectRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            InputStream = stream,
            ContentType = file.ContentType ?? "image/jpeg",
            DisablePayloadSigning = true
        };

        await client.PutObjectAsync(putRequest, ct);

        _logger.LogInformation("[CloudflareR2] Upload thành công file {Key} lên bucket {Bucket}", objectKey, bucketName);

        var baseUrl = publicUrl.TrimEnd('/');
        return $"{baseUrl}/{objectKey}";
    }

    private async Task<string> UploadLocallyAsync(IFormFile file, string ext, CancellationToken ct)
    {
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var coversDir = Path.Combine(webRoot, "book_covers");

        if (!Directory.Exists(coversDir))
        {
            Directory.CreateDirectory(coversDir);
        }

        var fileName = $"book_upload_{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(coversDir, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }

        return $"/book_covers/{fileName}";
    }
}
