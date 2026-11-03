using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.AddBook;

public static class AddBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/catalog/books",
            async (AddBookRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Catalog")
           .WithSummary("Add a new book to the catalog (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}