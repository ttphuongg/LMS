using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.ManageLocations;

/// <summary>Creates a new shelf location.</summary>
public record AddLocationRequest(
    string Aisle,
    string Shelf,
    int RowLevel,
    int? MaxCapacity
) : IRequest<ApiResponse<int>>;

/// <summary>Updates an existing shelf location.</summary>
public record UpdateLocationRequest(
    string Aisle,
    string Shelf,
    int RowLevel,
    int? MaxCapacity,
    bool IsActive
) : IRequest<ApiResponse<bool>>
{
    public int LocationId { get; set; }
}

/// <summary>Gets all locations.</summary>
public record GetAllLocationsRequest(bool? ActiveOnly = true) : IRequest<ApiResponse<List<LocationDetail>>>;

/// <summary>Gets a single location by Id.</summary>
public record GetLocationByIdRequest(int LocationId) : IRequest<ApiResponse<LocationDetail>>;

public record LocationDetail(
    int Id,
    string Aisle,
    string Shelf,
    int RowLevel,
    int? MaxCapacity,
    bool IsActive,
    int CurrentCount
);

