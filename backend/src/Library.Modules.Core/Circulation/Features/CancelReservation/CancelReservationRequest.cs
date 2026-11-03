using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.CancelReservation;

public record CancelReservationRequest(int AccountId) : IRequest<ApiResponse<bool>>
{
    public long ReservationId { get; set; }
}
