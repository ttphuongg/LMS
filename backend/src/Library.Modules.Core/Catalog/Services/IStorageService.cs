using Microsoft.AspNetCore.Http;

namespace Library.Modules.Core.Catalog.Services;

public interface IStorageService
{
    /// <summary>
    /// Tải ảnh bìa sách lên bộ nhớ đám mây (Cloudflare R2) hoặc lưu cục bộ (nếu chưa cấu hình R2).
    /// </summary>
    /// <param name="file">File ảnh được gửi từ form.</param>
    /// <param name="ct">CancellationToken.</param>
    /// <returns>Đường link URL công khai của ảnh.</returns>
    Task<string> UploadBookCoverAsync(IFormFile file, CancellationToken ct = default);
}
