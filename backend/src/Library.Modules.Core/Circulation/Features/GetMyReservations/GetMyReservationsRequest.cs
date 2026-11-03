using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetMyReservations;

public record GetMyReservationsRequest(int AccountId) : IRequest<ApiResponse<List<MyReservationDto>>>;

public record MyReservationDto(
    long Id,
    int BookId,
    string? BookTitle,
    int? BookCopyId,
    string? Barcode,
    string Status,
    DateTime ReservedAt,
    DateTime? ExpiresAt
);
