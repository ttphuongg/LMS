using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.ReturnBook;

public class ReturnBookValidator : AbstractValidator<ReturnBookRequest>
{
    public ReturnBookValidator()
    {
        RuleFor(x => x.LoanSlipId).GreaterThan(0).WithMessage("Mã phiếu mượn không hợp lệ.");
        RuleFor(x => x.LibrarianId).GreaterThan(0).WithMessage("Mã thủ thư không hợp lệ.");
        RuleFor(x => x.ReturnedCopies).NotEmpty().WithMessage("Danh sách sách trả không được để trống.");
    }
}
