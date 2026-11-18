using FluentAssertions;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Features.RequestRenewal;
using Library.UnitTests.TestHelpers;
using MediatR;
using NSubstitute;

namespace Library.UnitTests.Circulation;

public class RequestRenewalHandlerTests
{
    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
    private readonly ISender _sender = Substitute.For<ISender>();

    public RequestRenewalHandlerTests()
    {
        // Mặc định không bị khóa do nợ phạt
        _sender.Send(Arg.Any<CheckCirculationFineRestrictionQuery>(), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(false));
    }

    [Fact]
    public async Task Handle_Should_Fail_When_LoanDetail_Does_Not_Exist()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        var handler = new RequestRenewalHandler(db, _sender, new RequestRenewalValidator());
        var request = new RequestRenewalRequest(999, 1, Today.AddDays(7), "Muon doc them");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Chi tiết phiếu mượn không tồn tại");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_User_Has_Overdue_Fine_Restriction()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        _sender.Send(Arg.Is<CheckCirculationFineRestrictionQuery>(q => q.AccountId == 1), Arg.Any<CancellationToken>())
            .Returns(new CirculationFineRestrictionResult(true, "Bạn đang có khoản phạt quá hạn thanh toán"));

        var handler = new RequestRenewalHandler(db, _sender, new RequestRenewalValidator());
        var request = new RequestRenewalRequest(100, 1, Today.AddDays(7), "Muon doc them");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("khoản phạt quá hạn thanh toán");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_User_Does_Not_Own_Loan()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        var loanSlip = new LoanSlip
        {
            AccountId = 1, // Thuộc về account 1
            BorrowedAt = DateTime.UtcNow.AddDays(-7),
            DueDate = Today.AddDays(7),
            Status = LoanStatus.Borrowing
        };
        var detail = new LoanSlipDetail
        {
            LoanSlip = loanSlip,
            BookCopyId = 101,
            Status = LoanDetailStatus.Borrowing
        };
        db.LoanSlips.Add(loanSlip);
        db.LoanSlipDetails.Add(detail);
        await db.SaveChangesAsync();

        var handler = new RequestRenewalHandler(db, _sender, new RequestRenewalValidator());
        // Account 2 cố tình gia hạn sách của Account 1
        var request = new RequestRenewalRequest(detail.Id, 2, Today.AddDays(14), "Gia hạn");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Bạn không có quyền gia hạn sách này");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Book_Is_Not_In_Borrowing_Status()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        var loanSlip = new LoanSlip
        {
            AccountId = 1,
            BorrowedAt = DateTime.UtcNow.AddDays(-7),
            DueDate = Today.AddDays(7),
            Status = LoanStatus.Returned
        };
        var detail = new LoanSlipDetail
        {
            LoanSlip = loanSlip,
            BookCopyId = 101,
            Status = LoanDetailStatus.Returned // Đã trả xong
        };
        db.LoanSlips.Add(loanSlip);
        db.LoanSlipDetails.Add(detail);
        await db.SaveChangesAsync();

        var handler = new RequestRenewalHandler(db, _sender, new RequestRenewalValidator());
        var request = new RequestRenewalRequest(detail.Id, 1, Today.AddDays(14), "Gia hạn");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Sách này không ở trạng thái đang mượn");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Maximum_Renewals_Reached()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        var loanSlip = new LoanSlip
        {
            AccountId = 1,
            BorrowedAt = DateTime.UtcNow.AddDays(-20),
            DueDate = Today.AddDays(5),
            Status = LoanStatus.Borrowing
        };
        var detail = new LoanSlipDetail
        {
            LoanSlip = loanSlip,
            BookCopyId = 101,
            Status = LoanDetailStatus.Borrowing
        };

        // Đã có 3 lần Approved trước đó
        for (byte i = 1; i <= 3; i++)
        {
            detail.Renewals.Add(new Renewal
            {
                RenewalNumber = i,
                OldDueDate = Today.AddDays(i * 3),
                NewDueDate = Today.AddDays(i * 3 + 5),
                Status = RenewalStatus.Approved
            });
        }

        db.LoanSlips.Add(loanSlip);
        db.LoanSlipDetails.Add(detail);
        await db.SaveChangesAsync();

        var handler = new RequestRenewalHandler(db, _sender, new RequestRenewalValidator());
        var request = new RequestRenewalRequest(detail.Id, 1, Today.AddDays(25), "Gia hạn lần 4");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Đã đạt giới hạn 3 lần gia hạn");
    }

    [Fact]
    public async Task Handle_Should_Create_Pending_Renewal_When_Request_Is_Valid()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateCirculationDbContext();
        var loanSlip = new LoanSlip
        {
            AccountId = 1,
            BorrowedAt = DateTime.UtcNow.AddDays(-5),
            DueDate = Today.AddDays(5),
            Status = LoanStatus.Borrowing
        };
        var detail = new LoanSlipDetail
        {
            LoanSlip = loanSlip,
            BookCopyId = 101,
            Status = LoanDetailStatus.Borrowing
        };
        db.LoanSlips.Add(loanSlip);
        db.LoanSlipDetails.Add(detail);
        await db.SaveChangesAsync();

        var handler = new RequestRenewalHandler(db, _sender, new RequestRenewalValidator());
        var newDueDate = Today.AddDays(12);
        var request = new RequestRenewalRequest(detail.Id, 1, newDueDate, "Cần đọc nghiên cứu thêm");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var savedRenewal = db.Renewals.FirstOrDefault(r => r.Id == result.Data);
        savedRenewal.Should().NotBeNull();
        savedRenewal!.Status.Should().Be(RenewalStatus.Pending);
        savedRenewal.RenewalNumber.Should().Be(1);
        savedRenewal.NewDueDate.Should().Be(newDueDate);
    }
}
