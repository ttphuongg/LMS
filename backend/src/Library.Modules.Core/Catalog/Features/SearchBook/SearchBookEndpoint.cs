using System.Security.Claims;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Search.Features.LogSearch;
using Library.Modules.Core.Shared;
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
                int page = 1, int pageSize = 10,
                string? status = null, bool includeInactive = false,
                ClaimsPrincipal user = null!, IMediator mediator = null!, CancellationToken ct = default) =>
            {
                var isStaff = user?.IsInRole("Admin") == true || user?.IsInRole("Librarian") == true;
                BookStatus? parsedStatus = null;
                if (isStaff && !string.IsNullOrWhiteSpace(status) &&
                    Enum.TryParse<BookStatus>(status.Trim(), ignoreCase: true, out var s) &&
                    Enum.IsDefined(s))
                {
                    parsedStatus = s;
                }

                var req = new SearchBookRequest(
                    keyword, authorId, categoryId, language, publishedYear, page, pageSize,
                    parsedStatus, isStaff && includeInactive);
                var result = await mediator.Send(req, ct);

                if (result.Success &&
                    page == 1 &&
                    !string.IsNullOrWhiteSpace(keyword) &&
                    user.TryGetAccountId() is int accountId &&
                    accountId > 0)
                {
                    var normalized = keyword.Trim();
                    if (normalized.Length > 500) normalized = normalized[..500];
                    await mediator.Send(
                        new LogSearchRequest(accountId, normalized, "BOOK", result.Data?.TotalCount),
                        ct);
                }

                return Results.Ok(result);
            })
           .WithTags("Catalog")
           .WithSummary("Search and browse the book catalog")
           .AllowAnonymous();

        return app;
    }
}