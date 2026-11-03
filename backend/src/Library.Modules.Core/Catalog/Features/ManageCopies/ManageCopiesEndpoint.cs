using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

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

        // ── PATCH — Update copy status (Staff only) ───────────────────────────
        app.MapPatch("/api/catalog/copies/{copyId:int}/status",
            async (int copyId, UpdateCopyStatusRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { CopyId = copyId }, ct)))
           .WithTags("Catalog")
           .WithSummary("Update the status of a book copy (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}