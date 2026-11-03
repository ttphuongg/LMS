using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Library.Modules.Core.Catalog.Features.ManageLocations;

public static class ManageLocationsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        // ── POST — Add new shelf location (Staff only) ────────────────────────
        app.MapPost("/api/catalog/locations",
            async (AddLocationRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req, ct)))
           .WithTags("Catalog - Locations")
           .WithSummary("Add a new shelf location (Staff only)")
           .RequireAuthorization("StaffOnly");

        // ── PUT — Update shelf location (Staff only) ──────────────────────────
        app.MapPut("/api/catalog/locations/{id:int}",
            async (int id, UpdateLocationRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { LocationId = id }, ct)))
           .WithTags("Catalog - Locations")
           .WithSummary("Update a shelf location (Staff only)")
           .RequireAuthorization("StaffOnly");

        // ── GET — List all shelf locations (Staff only) ───────────────────────
        app.MapGet("/api/catalog/locations",
            async (bool? activeOnly, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(new GetAllLocationsRequest(activeOnly), ct)))
           .WithTags("Catalog - Locations")
           .WithSummary("List all shelf locations (Staff only)")
           .RequireAuthorization("StaffOnly");

        // ── GET — Get shelf location by ID (Staff only) ───────────────────────
        app.MapGet("/api/catalog/locations/{id:int}",
            async (int id, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(new GetLocationByIdRequest(id), ct)))
           .WithTags("Catalog - Locations")
           .WithSummary("Get a shelf location by ID (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}

