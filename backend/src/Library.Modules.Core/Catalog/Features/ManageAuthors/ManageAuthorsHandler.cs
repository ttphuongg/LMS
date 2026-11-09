using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.ManageAuthors;

public sealed class ManageAuthorsHandler : 
    IRequestHandler<AddAuthorRequest, ApiResponse<int>>,
    IRequestHandler<GetAuthorsRequest, ApiResponse<List<AuthorDto>>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<AddAuthorRequest> _addValidator;

    public ManageAuthorsHandler(CatalogDbContext db, IValidator<AddAuthorRequest> addValidator)
    {
        _db = db;
        _addValidator = addValidator;
    }

    public async Task<ApiResponse<int>> Handle(AddAuthorRequest request, CancellationToken ct)
    {
        var val = await _addValidator.ValidateAsync(request, ct);
        if (!val.IsValid) return ApiResponse<int>.Fail(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

        var author = new Author { Name = request.Name.Trim(), Biography = request.Biography?.Trim() };
        _db.Authors.Add(author);
        await _db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(author.Id);
    }

    public async Task<ApiResponse<List<AuthorDto>>> Handle(GetAuthorsRequest request, CancellationToken ct)
    {
        IQueryable<Author> query = _db.Authors.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Keyword))
            query = query.Where(a => a.Name.Contains(request.Keyword.Trim()));

        var result = await query.OrderBy(a => a.Name).Select(a => new AuthorDto(a.Id, a.Name, a.Biography)).ToListAsync(ct);
        return ApiResponse<List<AuthorDto>>.Ok(result);
    }
}
