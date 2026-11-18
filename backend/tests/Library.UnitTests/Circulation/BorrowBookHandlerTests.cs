using FluentAssertions;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Features.BorrowBook;
using Library.Modules.Core.Identity.Contracts;
using Library.UnitTests.TestHelpers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Circulation;

public class BorrowBookHandlerTests
{
    private readonly CirculationDbContext _db = TestDbContextFactory.CreateCirculationDbContext();
    private readonly BorrowBookValidator _validator = new();
    private readonly ISender _sender = Substitute.For<ISender>();

    [Fact]
    public async Task Handle_Should_Succeed_When_Account_And_Copies_Are_Valid()
    {
        // Arrange
        var handler = new BorrowBookHandler(_db, _sender, _validator);
        var dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        var request = new BorrowBookRequest(
            AccountId: 10,
            LibrarianId: 1,
            BookCopyIds: [100],
            DueDate: dueDate,
            Notes: "Mượn nghiên cứu"
        );

        // Mock Account Active
        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(10, "Nguyễn Văn A", true, "reader01", "Active"));

        // Mock No Fine Restriction
        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(false));

        // Mock Copy Infos
        var copyMap = new Dictionary<int, CopyInfo>
        {
            [100] = new CopyInfo(100, "BC-100", 1, "Sách C#", true, CopyCondition.Good, CopyStatus.Available, "Kệ 1")
        };
        _sender.Send(Arg.Is<GetCopyInfosQuery>(q => q.CopyIds.Contains(100)), Arg.Any<CancellationToken>())
            .Returns(copyMap);

        _sender.Send(Arg.Is<SetCopyStatusCommand>(c => c.CopyId == 100 && c.NewStatus == CopyStatus.Borrowed), Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var loanSlip = await _db.LoanSlips.Include(l => l.Details).FirstOrDefaultAsync(l => l.Id == result.Data);
        loanSlip.Should().NotBeNull();
        loanSlip!.AccountId.Should().Be(10);
        loanSlip.Status.Should().Be(LoanStatus.Borrowing);
        loanSlip.Details.Should().HaveCount(1);
        loanSlip.Details.First().BookCopyId.Should().Be(100);
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Account_Is_Locked_Or_Inactive()
    {
        // Arrange
        var handler = new BorrowBookHandler(_db, _sender, _validator);
        var dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        var request = new BorrowBookRequest(
            AccountId: 10,
            LibrarianId: 1,
            BookCopyIds: [100],
            DueDate: dueDate,
            Notes: null
        );

        // Mock Account Locked
        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(10, "Tài khoản bị khóa", false, "locked_user", "Locked"));

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
        var handler = new BorrowBookHandler(_db, _sender, _validator);
        var dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        var request = new BorrowBookRequest(
            AccountId: 10,
            LibrarianId: 1,
            BookCopyIds: [100],
            DueDate: dueDate,
            Notes: null
        );

        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(10, "Nguyễn Văn A", true, "reader01", "Active"));

        // Has unpaid fines restriction
        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(true, "Chức năng mượn sách của độc giả đang bị khóa do có khoản phạt quá hạn thanh toán."));

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("khoản phạt quá hạn thanh toán");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Copy_Is_Already_Borrowed()
    {
        // Arrange
        var handler = new BorrowBookHandler(_db, _sender, _validator);
        var dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        var request = new BorrowBookRequest(
            AccountId: 10,
            LibrarianId: 1,
            BookCopyIds: [100],
            DueDate: dueDate,
            Notes: null
        );

        _sender.Send(Arg.Is<GetAccountSummaryQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new AccountSummary(10, "Nguyễn Văn A", true, "reader01", "Active"));

        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 10), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(false));

        // Copy is Borrowed
        var copyMap = new Dictionary<int, CopyInfo>
        {
            [100] = new CopyInfo(100, "BC-100", 1, "Sách C#", true, CopyCondition.Good, CopyStatus.Borrowed, "Kệ 1")
        };
        _sender.Send(Arg.Is<GetCopyInfosQuery>(q => q.CopyIds.Contains(100)), Arg.Any<CancellationToken>())
            .Returns(copyMap);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("không sẵn sàng để mượn");
    }
}
