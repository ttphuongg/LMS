using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Shared.Events;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Library.Modules.Core.Circulation.Features.BorrowBook;

namespace Library.Modules.Core.Circulation.Features.GetAllReservations;

public static class GetAllReservationsEndpoint
{
    public static IEndpointRouteBuilder Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/circulation/reservations", async (int? status, IMediator mediator, CancellationToken ct, int page = 1, int pageSize = 10) =>
            Results.Ok(await mediator.Send(new GetAllReservationsRequest(status, page, pageSize), ct)))
            .WithTags("Circulation Admin")
            .WithSummary("Get all reservations (Staff only)")
            .RequireAuthorization("StaffOnly");

        // ── POST — Mark reservation ready for pickup (Staff only) ─────────────────
        app.MapPost("/api/circulation/reservations/{id:long}/ready",
            async (long id, CirculationDbContext db, IMediator mediator, CancellationToken ct) =>
            {
                var reservation = await db.Reservations.FirstOrDefaultAsync(r => r.Id == id, ct);
                if (reservation == null)
                    return Results.Ok(ApiResponse<object?>.Fail($"Không tìm thấy yêu cầu đặt trước #{id}."));

                reservation.Status = ReservationStatus.Ready;
                reservation.ExpiresAt = DateTime.UtcNow.AddHours(48);
                await db.SaveChangesAsync(ct);

                await mediator.Publish(new ReservationReadyEvent(
                    reservation.Id, reservation.AccountId, reservation.BookCopyId, reservation.ExpiresAt), ct);

                return Results.Ok(ApiResponse<object>.Ok(new { reservation.Id, Status = reservation.Status.ToString(), reservation.ExpiresAt }));
            })
            .WithTags("Circulation Admin")
            .WithSummary("Mark reservation as ready for pickup (Staff only)")
            .RequireAuthorization("StaffOnly");

        // ── POST — Hand over / fulfill reservation (Staff only) ──────────────────
        app.MapPost("/api/circulation/reservations/{id:long}/fulfill",
            async (long id, ClaimsPrincipal user, CirculationDbContext db, IMediator mediator, CancellationToken ct) =>
            {
                var reservation = await db.Reservations.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
                if (reservation == null)
                    return Results.Ok(ApiResponse<object?>.Fail($"Không tìm thấy yêu cầu đặt trước #{id}."));

                if (reservation.Status != ReservationStatus.Ready || reservation.BookCopyId == null)
                    return Results.Ok(ApiResponse<object?>.Fail("Chỉ giao được đặt trước đang Ready và đã gán bản sao."));

                if (reservation.ExpiresAt.HasValue && reservation.ExpiresAt < DateTime.UtcNow)
                    return Results.Ok(ApiResponse<object?>.Fail("Đặt trước đã quá hạn nhận sách."));

                const int LoanDays = 14; // chỉnh theo quy định thư viện
                var result = await mediator.Send(new BorrowBookRequest(
                    reservation.AccountId,
                    user.GetAccountId(),
                    DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)).AddDays(LoanDays),
                    new List<int> { reservation.BookCopyId.Value },
                    $"Nhận sách từ đặt trước #{reservation.Id}"), ct);

                if (!result.Success)
                    return Results.Ok(ApiResponse<object?>.Fail(result.Error ?? "Không tạo được phiếu mượn."));

                // BorrowBookHandler đã chuyển reservation sang Completed
                return Results.Ok(ApiResponse<object>.Ok(new { ReservationId = id, LoanSlipId = result.Data, Status = "Completed" }));
            })
            .WithTags("Circulation Admin")
            .WithSummary("Fulfill reservation: create loan slip for the reserved copy (Staff only)")
            .RequireAuthorization("StaffOnly");

        return app;
    }
}
