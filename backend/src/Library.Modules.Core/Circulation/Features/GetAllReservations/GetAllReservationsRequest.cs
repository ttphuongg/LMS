using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Circulation.Features.GetAllReservations;

public record GetAllReservationsRequest(int? Status, int Page, int PageSize) : IRequest<ApiResponse<GetAllReservationsResult>>;
public record GetAllReservationsResult(List<ReservationSummaryDto> Items, int TotalCount);
public record ReservationSummaryDto(long Id, int AccountId, int BookId, int? BookCopyId, string Status, DateTime ReservedAt, string? ReaderName = null, string? BookTitle = null);
