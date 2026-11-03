using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.ManageCategories;

public static class ManageCategoriesEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/catalog/categories", async (AddCategoryRequest req, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Catalog")
           .WithSummary("Add new category (Staff only)")
           .RequireAuthorization("StaffOnly");

        app.MapGet("/api/catalog/categories", async (IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetCategoriesRequest(), ct)))
           .WithTags("Catalog")
           .WithSummary("List categories (Public)")
           .AllowAnonymous();

        return app;
    }
}