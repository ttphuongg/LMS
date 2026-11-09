using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.ManageCategories;

public sealed class ManageCategoriesHandler : 
    IRequestHandler<AddCategoryRequest, ApiResponse<int>>,
    IRequestHandler<GetCategoriesRequest, ApiResponse<List<CategoryDto>>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<AddCategoryRequest> _addValidator;

    public ManageCategoriesHandler(CatalogDbContext db, IValidator<AddCategoryRequest> addValidator)
    {
        _db = db;
        _addValidator = addValidator;
    }

    public async Task<ApiResponse<int>> Handle(AddCategoryRequest request, CancellationToken ct)
    {
        var val = await _addValidator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<int>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var category = new Category { Name = request.Name.Trim(), Description = request.Description?.Trim() };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(category.Id);
    }

    public async Task<ApiResponse<List<CategoryDto>>> Handle(GetCategoriesRequest request, CancellationToken ct)
    {
        var result = await _db.Categories.AsNoTracking().OrderBy(c => c.Name).Select(c => new CategoryDto(c.Id, c.Name, c.Description)).ToListAsync(ct);
        return ApiResponse<List<CategoryDto>>.Ok(result);
    }
}
