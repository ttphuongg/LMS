using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Catalog.Features.ManageCategories;

public record AddCategoryRequest(string Name, string? Description) : IRequest<ApiResponse<int>>;
public record GetCategoriesRequest() : IRequest<ApiResponse<List<CategoryDto>>>;
public record CategoryDto(int Id, string Name, string? Description);
