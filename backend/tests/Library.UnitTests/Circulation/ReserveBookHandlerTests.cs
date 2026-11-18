using FluentAssertions;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Features.ReserveBook;
using Library.Modules.Core.Identity.Contracts;
using Library.UnitTests.TestHelpers;
using MediatR;
using NSubstitute;

namespace Library.UnitTests.Circulation;

public class ReserveBookHandlerTests
{
    private readonly ISender _sender = Substitute.For<ISender>();
    private readonly IMediator _mediator = Substitute.For<IMediator>();

    [Fact]
    public async Task Handle_Should_Fail_When_Account_Is_Locked_Or_Inactive()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(1, "Locked User", false, "locked_user", "Locked"));

        var handler = new ReserveBookHandler(db, _sender, new ReserveBookValidator(), _mediator);
        var request = new ReserveBookRequest(1, 10);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tài khoản bị khóa hoặc không hoạt động");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Account_Has_Unpaid_Fines()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(1, "Reader One", true, "reader1", "Active"));

        _sender.Send(Arg.Is<GetBookInfosQuery>(q => q.BookIds.Contains(10)), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, BookInfo> { [10] = new BookInfo(10, "Clean Architecture", true) });

        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(true, "Tài khoản của bạn đang bị khóa chức năng đặt trước do có khoản phạt quá hạn thanh toán."));

        var handler = new ReserveBookHandler(db, _sender, new ReserveBookValidator(), _mediator);
        var request = new ReserveBookRequest(1, 10);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("khoản phạt quá hạn thanh toán");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Already_Has_Active_Reservation_For_Same_Book()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        db.Reservations.Add(new Reservation
        {
            AccountId = 1,
            BookId = 10,
            Status = ReservationStatus.Waiting
        });
        await db.SaveChangesAsync();

        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(1, "Reader One", true, "reader1", "Active"));

        _sender.Send(Arg.Is<GetBookInfosQuery>(q => q.BookIds.Contains(10)), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, BookInfo> { [10] = new BookInfo(10, "Clean Architecture", true) });

        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(false));

        var handler = new ReserveBookHandler(db, _sender, new ReserveBookValidator(), _mediator);
        var request = new ReserveBookRequest(1, 10);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Bạn đã có một yêu cầu đặt trước đang chờ hoặc sẵn sàng nhận");
    }

    [Fact]
    public async Task Handle_Should_Create_Waiting_Reservation_When_No_Copies_Available()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(1, "Reader One", true, "reader1", "Active"));

        _sender.Send(Arg.Is<GetBookInfosQuery>(q => q.BookIds.Contains(10)), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, BookInfo> { [10] = new BookInfo(10, "Clean Architecture", true) });

        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(false));

        // Không có bản sao Available nào (đang mượn hết)
        _sender.Send(Arg.Is<FindAvailableCopyQuery>(q => q.BookId == 10), Arg.Any<CancellationToken>())
            .Returns((CopyInfo?)null);

        var handler = new ReserveBookHandler(db, _sender, new ReserveBookValidator(), _mediator);
        var request = new ReserveBookRequest(1, 10);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var reservation = db.Reservations.FirstOrDefault(r => r.Id == result.Data);
        reservation.Should().NotBeNull();
        reservation!.Status.Should().Be(ReservationStatus.Waiting);
        reservation.BookCopyId.Should().BeNull();
    }

    [Fact]
    public async Task Handle_Should_Create_Ready_Reservation_When_Copy_Is_Available()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(1, "Reader One", true, "reader1", "Active"));

        _sender.Send(Arg.Is<GetBookInfosQuery>(q => q.BookIds.Contains(10)), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, BookInfo> { [10] = new BookInfo(10, "Domain-Driven Design", true) });

        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(false));

        // Có 1 bản sao khả dụng
        var copy = new CopyInfo(101, "BC-101", 10, "Domain-Driven Design", true, CopyCondition.Good, CopyStatus.Available);
        _sender.Send(Arg.Is<FindAvailableCopyQuery>(q => q.BookId == 10), Arg.Any<CancellationToken>())
            .Returns(copy);

        _sender.Send(Arg.Is<SetCopyStatusCommand>(c => c.CopyId == 101 && c.NewStatus == CopyStatus.Reserved), Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new ReserveBookHandler(db, _sender, new ReserveBookValidator(), _mediator);
        var request = new ReserveBookRequest(1, 10);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var reservation = db.Reservations.FirstOrDefault(r => r.Id == result.Data);
        reservation.Should().NotBeNull();
        reservation!.Status.Should().Be(ReservationStatus.Ready);
        reservation.BookCopyId.Should().Be(101);
        reservation.ExpiresAt.Should().NotBeNull();
    }
}
