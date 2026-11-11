using FluentValidation;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Services;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public sealed class ReturnBookHandler : IRequestHandler<ReturnBookRequest, ApiResponse<bool>>
{
    private readonly CirculationDbContext _db;
    private readonly ISender _sender;
    private readonly IValidator<ReturnBookRequest> _validator;
    private readonly IMediator _mediator;

    public ReturnBookHandler(CirculationDbContext db, ISender sender, IValidator<ReturnBookRequest> validator, IMediator mediator)
    {
        _db = db;
        _sender = sender;
        _validator = validator;
        _mediator = mediator;
    }

    public async Task<ApiResponse<bool>> Handle(ReturnBookRequest request, CancellationToken ct)
    {
        var validation = await _validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ApiResponse<bool>.Fail(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var loanSlip = await _db.LoanSlips
            .Include(l => l.Details)
                .ThenInclude(d => d.Renewals)
            .FirstOrDefaultAsync(l => l.Id == request.LoanSlipId, ct);

        if (loanSlip == null)
            return ApiResponse<bool>.Fail("Phiếu mượn không tồn tại.");

        var copyIdsToUpdate = loanSlip.Details
            .Where(d => request.ReturnedCopies.Any(r => r.LoanSlipDetailId == d.Id))
            .Select(d => d.BookCopyId)
            .Distinct()
            .ToList();

        var copyInfoMap = await _sender.Send(new GetCopyInfosQuery(copyIdsToUpdate), ct);

        // Giờ Việt Nam UTC+7
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

        foreach (var ret in request.ReturnedCopies)
        {
            var detail = loanSlip.Details.FirstOrDefault(d => d.Id == ret.LoanSlipDetailId);
            if (detail != null && detail.Status == LoanDetailStatus.Borrowing)
            {
                detail.Status = LoanDetailStatus.Returned;
                detail.ActualReturnDate = today;
                detail.Notes = ret.Notes;
                detail.UpdatedAt = DateTime.UtcNow;
                detail.UpdatedBy = request.LibrarianId;

                var effectiveDueDate = detail.GetEffectiveDueDate();
                if (effectiveDueDate == default)
                    effectiveDueDate = loanSlip.DueDate;

                if (today > effectiveDueDate)
                {
                    await _mediator.Publish(new LoanOverdueEvent(
                        detail.Id,
                        loanSlip.AccountId,
                        detail.BookCopyId,
                        effectiveDueDate), ct);
                }

                if (copyInfoMap.TryGetValue(detail.BookCopyId, out var copyInfo))
                {
                    var nextStatus = await _sender.Send(new ReleaseCopyCommand(copyInfo.BookId, detail.BookCopyId), ct);
                    await _sender.Send(new SetCopyStatusCommand(detail.BookCopyId, null, nextStatus, ret.Condition), ct);
                }
            }
        }

        if (loanSlip.Details.All(d => d.Status != LoanDetailStatus.Borrowing))
        {
            loanSlip.Status = LoanStatus.Returned;
            loanSlip.UpdatedAt = DateTime.UtcNow;
            loanSlip.UpdatedBy = request.LibrarianId;
        }

        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
