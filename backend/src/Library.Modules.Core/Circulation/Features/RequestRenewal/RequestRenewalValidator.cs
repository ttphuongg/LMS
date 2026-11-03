using FluentValidation;

namespace Library.Modules.Core.Circulation.Features.RequestRenewal;

public class RequestRenewalValidator : AbstractValidator<RequestRenewalRequest>
{
    public RequestRenewalValidator()
    {
        RuleFor(x => x.LoanSlipDetailId).GreaterThan(0).WithMessage("Chi tiết phiếu mượn không hợp lệ.");
        RuleFor(x => x.AccountId).GreaterThan(0).WithMessage("Tài khoản không hợp lệ.");
        RuleFor(x => x.NewDueDate).GreaterThan(DateOnly.FromDateTime(DateTime.UtcNow)).WithMessage("Ngày gia hạn phải lớn hơn hôm nay.");
    }
}
