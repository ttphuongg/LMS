using FluentValidation;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Shared;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Catalog.Features.UpdateBookStatus;

public record UpdateBookStatusRequest(int BookId, BookStatus NewStatus) : IRequest<ApiResponse<bool>>;

public sealed class UpdateBookStatusValidator : AbstractValidator<UpdateBookStatusRequest>
{
    public UpdateBookStatusValidator()
    {
        RuleFor(x => x.BookId)
            .GreaterThan(0).WithMessage("BookId không hợp lệ.");

        RuleFor(x => x.NewStatus)
            .IsInEnum().WithMessage("Trạng thái đầu sách không hợp lệ.");
    }
}

public sealed class UpdateBookStatusHandler : IRequestHandler<UpdateBookStatusRequest, ApiResponse<bool>>
{
    private readonly CatalogDbContext _db;
    private readonly IValidator<UpdateBookStatusRequest> _validator;

    public UpdateBookStatusHandler(CatalogDbContext db, IValidator<UpdateBookStatusRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateBookStatusRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<bool>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == request.BookId, ct);
        if (book is null)
            return ApiResponse<bool>.Fail($"Sách với Id = {request.BookId} không tồn tại.");

        if (request.NewStatus == BookStatus.Inactive)
        {
            var hasBusyCopies = await _db.BookCopies.AnyAsync(
                c => c.BookId == book.Id && (c.Status == CopyStatus.Borrowed || c.Status == CopyStatus.Reserved),
                ct);
            if (hasBusyCopies)
                return ApiResponse<bool>.Fail("Không thể ngừng lưu hành đầu sách đang có bản sao được mượn hoặc đặt trước.");
        }

        book.Status = request.NewStatus;
        book.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true);
    }
}

public static class UpdateBookStatusEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/catalog/books/{bookId:int}/status",
            async (int bookId, UpdateBookStatusRequest req, IMediator mediator, CancellationToken ct) =>
                Results.Ok(await mediator.Send(req with { BookId = bookId }, ct)))
           .WithTags("Catalog")
           .WithSummary("Update book status (Active/Inactive) (Staff only)")
           .RequireAuthorization("StaffOnly");

        return app;
    }
}

