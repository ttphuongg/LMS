using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.BorrowBook;

public class BorrowBookValidator : AbstractValidator<BorrowBookRequest>
{
    public BorrowBookValidator()
    {
        RuleFor(x => x.AccountId).GreaterThan(0).WithMessage("AccountId không hợp lệ.");
        
        RuleFor(x => x.DueDate)
            .GreaterThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Ngày hạn trả phải lớn hơn ngày hiện tại.");
            
        RuleFor(x => x.BookCopyIds)
            .NotEmpty().WithMessage("Phải chọn ít nhất một sách để mượn.");
    }
}
