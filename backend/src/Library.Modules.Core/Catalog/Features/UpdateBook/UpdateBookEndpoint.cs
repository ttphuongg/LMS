using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.UpdateBook;

public static class UpdateBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/catalog/books/{bookId:int}", async (int bookId, UpdateBookRequest req, IMediator mediator, CancellationToken ct) =>
        {
            req.BookId = bookId;
            return Results.Ok(await mediator.Send(req, ct));
        })
        .WithTags("Catalog")
        .WithSummary("Update book details (Staff only)")
        .RequireAuthorization("StaffOnly");
        return app;
    }
}