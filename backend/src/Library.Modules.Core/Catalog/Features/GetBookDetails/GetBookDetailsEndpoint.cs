using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.GetBookDetails;

public static class GetBookDetailsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/catalog/books/{bookId:int}", async (int bookId, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetBookDetailsRequest(bookId), ct)))
            .WithTags("Catalog")
            .WithSummary("Get full book details");
        return app;
    }
}
