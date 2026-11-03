using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.SearchBook;

public static class SearchBookEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/catalog/books",
            async (
                string? keyword, int? authorId, int? categoryId,
                string? language, short? publishedYear,
                int page, int pageSize,
                IMediator mediator, CancellationToken ct) =>
            {
                var req = new SearchBookRequest(keyword, authorId, categoryId, language, publishedYear, page, pageSize);
                return Results.Ok(await mediator.Send(req, ct));
            })
           .WithTags("Catalog")
           .WithSummary("Search and browse the book catalog")
           .AllowAnonymous();

        return app;
    }
}
