using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.ManageLocations;

/// <summary>Handles creating a new shelf location.</summary>
public sealed class AddLocationHandler : IRequestHandler<AddLocationRequest, ApiResponse<int>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<AddLocationRequest> _validator;

    public AddLocationHandler(CatalogDbContext db, IValidator<AddLocationRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<int>> Handle(AddLocationRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<int>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        // Check unique (Aisle, Shelf, RowLevel)
        var aisle = request.Aisle.Trim();
        var shelf = request.Shelf.Trim();
        if (await _db.Locations.AnyAsync(
                l => l.Aisle == aisle && l.Shelf == shelf && l.RowLevel == request.RowLevel, ct))
            return ApiResponse<int>.Fail(
                $"Tọa độ ({aisle}, {shelf}, Tầng {request.RowLevel}) đã tồn tại.");

        var location = new Location
        {
            Aisle = aisle,
            Shelf = shelf,
            RowLevel = request.RowLevel,
            MaxCapacity = request.MaxCapacity,
            IsActive = true
        };

        _db.Locations.Add(location);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(location.Id);
    }
}

/// <summary>Handles updating an existing shelf location.</summary>
public sealed class UpdateLocationHandler : IRequestHandler<UpdateLocationRequest, ApiResponse<bool>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<UpdateLocationRequest> _validator;

    public UpdateLocationHandler(CatalogDbContext db, IValidator<UpdateLocationRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateLocationRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<bool>.Fail(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var location = await _db.Locations.FindAsync([request.LocationId], ct);
        if (location is null)
            return ApiResponse<bool>.Fail($"Vị trí với Id = {request.LocationId} không tồn tại.");

        if (request.MaxCapacity.HasValue)
        {
            var currentCount = await _db.BookCopies.CountAsync(c => c.LocationId == request.LocationId, ct);
            if (request.MaxCapacity.Value < currentCount)
                return ApiResponse<bool>.Fail(
                    $"Sức chứa tối đa ({request.MaxCapacity.Value}) không thể nhỏ hơn số bản sao đang lưu trữ ({currentCount}).");
        }

        // Check unique if coordinates changed
        var aisle = request.Aisle.Trim();
        var shelf = request.Shelf.Trim();
        if (aisle != location.Aisle || shelf != location.Shelf || request.RowLevel != location.RowLevel)
        {
            if (await _db.Locations.AnyAsync(
                    l => l.Id != request.LocationId
                         && l.Aisle == aisle && l.Shelf == shelf && l.RowLevel == request.RowLevel, ct))
                return ApiResponse<bool>.Fail(
                    $"Tọa độ ({aisle}, {shelf}, Tầng {request.RowLevel}) đã tồn tại.");
        }

        location.Aisle = aisle;
        location.Shelf = shelf;
        location.RowLevel = request.RowLevel;
        location.MaxCapacity = request.MaxCapacity;
        location.IsActive = request.IsActive;
        location.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}

/// <summary>Handles listing all locations.</summary>
public sealed class GetAllLocationsHandler : IRequestHandler<GetAllLocationsRequest, ApiResponse<List<LocationDetail>>>
{
    private readonly CatalogDbContext _db;
    public GetAllLocationsHandler(CatalogDbContext db) => _db = db;

    public async Task<ApiResponse<List<LocationDetail>>> Handle(GetAllLocationsRequest request, CancellationToken ct)
    {
        var query = _db.Locations.AsQueryable();

        if (request.ActiveOnly == true)
            query = query.Where(l => l.IsActive);

        var locations = await query
            .OrderBy(l => l.Aisle).ThenBy(l => l.Shelf).ThenBy(l => l.RowLevel)
            .Select(l => new LocationDetail(
                l.Id,
                l.Aisle,
                l.Shelf,
                l.RowLevel,
                l.MaxCapacity,
                l.IsActive,
                l.BookCopies.Count
            ))
            .ToListAsync(ct);

        return ApiResponse<List<LocationDetail>>.Ok(locations);
    }
}

/// <summary>Handles getting a single location by Id.</summary>
public sealed class GetLocationByIdHandler : IRequestHandler<GetLocationByIdRequest, ApiResponse<LocationDetail>>
{
    private readonly CatalogDbContext _db;
    public GetLocationByIdHandler(CatalogDbContext db) => _db = db;

    public async Task<ApiResponse<LocationDetail>> Handle(GetLocationByIdRequest request, CancellationToken ct)
    {
        var location = await _db.Locations
            .AsNoTracking()
            .Where(l => l.Id == request.LocationId)
            .Select(l => new LocationDetail(
                l.Id,
                l.Aisle,
                l.Shelf,
                l.RowLevel,
                l.MaxCapacity,
                l.IsActive,
                l.BookCopies.Count,
                l.BookCopies
                    .OrderBy(c => c.Barcode)
                    .Select(c => new LocationCopyItem(
                        c.Id,
                        c.Barcode,
                        c.BookId,
                        c.Book.Title,
                        c.Status.ToString(),
                        c.Condition.ToString()))
                    .ToList()
            ))
            .FirstOrDefaultAsync(ct);

        if (location is null)
            return ApiResponse<LocationDetail>.Fail($"Vị trí với Id = {request.LocationId} không tồn tại.");

        return ApiResponse<LocationDetail>.Ok(location);
    }
}

