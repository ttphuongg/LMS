using Library.Modules.Core.Catalog.Services;
using Library.Modules.Core.Shared;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.UploadBookCover;

public static class UploadBookCoverEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/catalog/books/upload-cover", async (
            IFormFile file,
            IStorageService storageService,
            CancellationToken ct) =>
        {
            try
            {
                var url = await storageService.UploadBookCoverAsync(file, ct);
                return Results.Ok(ApiResponse<string>.Ok(url));
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                return Results.Problem(detail: ex.Message, title: "Lỗi tải ảnh bìa lên hệ thống", statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithTags("Catalog")
        .WithSummary("Thủ thư tải ảnh bìa sách lên hệ thống (Cloudflare R2)")
        .RequireAuthorization("StaffOnly")
        .DisableAntiforgery();

        return app;
    }
}
