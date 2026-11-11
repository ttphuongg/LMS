using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.ManageCopies;

public static class ManageCopiesEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        // ── POST — Add a new physical copy to a book (Staff only) ─────────────
        app.MapPost("/api/catalog/books/{bookId:int}/copies",
            async (int bookId, AddCopyRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { BookId = bookId }, ct)))
           .WithTags("Catalog")
           .WithSummary("Add a physical copy to a book (Staff only)")
           .RequireAuthorization("StaffOnly");

        // ── GET — List all copies of a book (Public) ──────────────────────────
        app.MapGet("/api/catalog/books/{bookId:int}/copies",
            async (int bookId, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(new GetCopiesRequest(bookId), ct)))
           .WithTags("Catalog")
           .WithSummary("List all physical copies of a book")
           .AllowAnonymous();

        // ── GET — Lookup copy by barcode ──────────────────────────────────────
        app.MapGet("/api/catalog/copies/lookup",
            async (string barcode, CatalogDbContext db, CancellationToken ct) =>
            {
                var copy = await db.BookCopies
                    .Include(c => c.Book)
                    .Include(c => c.Location)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Barcode == barcode.Trim(), ct);

                if (copy == null)
                    return Results.Ok(ApiResponse<object?>.Fail($"Không tìm thấy bản sao với mã vạch '{barcode}'."));

                return Results.Ok(ApiResponse<object>.Ok(new
                {
                    copy.Id,
                    copy.BookId,
                    copy.Barcode,
                    copy.LocationId,
                    LocationLabel = copy.Location != null
                        ? copy.Location.Aisle + " - " + copy.Location.Shelf + " - Tầng " + copy.Location.RowLevel
                        : null,
                    Status = copy.Status.ToString(),
                    Condition = copy.Condition.ToString(),
                    copy.AcquiredDate,
                    BookTitle = copy.Book != null ? copy.Book.Title : null
                }));
            })
           .WithTags("Catalog")
           .WithSummary("Lookup a physical copy by its barcode")
           .RequireAuthorization("StaffOnly");

        // ── PATCH — Update copy status (Staff only) ───────────────────────────
        app.MapPatch("/api/catalog/copies/{copyId:int}/status",
            async (int copyId, UpdateCopyStatusRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { CopyId = copyId }, ct)))
           .WithTags("Catalog")
           .WithSummary("Update the status of a book copy (Staff only)")
           .RequireAuthorization("StaffOnly");

        // ── PATCH — Assign or move copy shelf location (Staff only) ────────────
        app.MapPatch("/api/catalog/copies/{copyId:int}/location",
            async (int copyId, UpdateCopyLocationRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { CopyId = copyId }, ct)))
           .WithTags("Catalog")
           .WithSummary("Assign or move a book copy to a shelf location (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}
