using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetCirculationEligibility;

public record GetCirculationEligibilityRequest(int AccountId) 
    : IRequest<ApiResponse<CirculationEligibilityDto>>;

public record CirculationEligibilityDto(
    bool IsEligible,
    string? RestrictionReason,
    bool HasOverdueLoans,
    int OverdueLoansCount,
    bool HasOverdueFines,
    int OverdueFinesCount,
    decimal TotalOverdueFineAmount
);

