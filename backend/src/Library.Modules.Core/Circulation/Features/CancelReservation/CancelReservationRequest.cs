using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Persistence;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.CancelReservation;

public record CancelReservationRequest(int AccountId, bool IsStaff = false) : IRequest<ApiResponse<bool>>, ITransactionalCommand
{
    public long ReservationId { get; set; }
}
