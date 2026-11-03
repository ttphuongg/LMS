using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.ManageAuthors;

public static class ManageAuthorsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/catalog/authors", async (AddAuthorRequest req, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Catalog")
           .WithSummary("Add new author (Staff only)")
           .RequireAuthorization("StaffOnly");

        app.MapGet("/api/catalog/authors", async (string? keyword, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetAuthorsRequest(keyword), ct)))
           .WithTags("Catalog")
           .WithSummary("Search authors (Public)")
           .AllowAnonymous();

        return app;
    }
}