using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.ApproveRenewal;

public record ApproveRenewalRequest(
    int LibrarianId,
    RenewalStatus Status,
    string? Reason
) : IRequest<ApiResponse<bool>>
{
    public long RenewalId { get; set; }
}
