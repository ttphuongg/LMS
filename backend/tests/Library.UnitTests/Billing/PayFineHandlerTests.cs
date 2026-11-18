using FluentAssertions;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.PayFine;
using Library.UnitTests.TestHelpers;

namespace Library.UnitTests.Billing;

public class PayFineHandlerTests
{
    [Fact]
    public async Task Handle_Should_Fail_When_Fine_Does_Not_Exist()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateBillingDbContext();
        var handler = new PayFineHandler(db, new PayFineValidator());
        var request = new PayFineRequest(FineId: 999, LibrarianId: 10, PaymentMethod: PaymentMethod.Cash);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Phiếu phạt không tồn tại");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Fine_Is_Already_Paid()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateBillingDbContext();
        var fine = new Fine
        {
            AccountId = 1,
            Amount = 50000,
            FineType = FineType.Compensation,
            Status = FineStatus.Paid // Đã trả rồi
        };
        db.Fines.Add(fine);
        await db.SaveChangesAsync();

        var handler = new PayFineHandler(db, new PayFineValidator());
        var request = new PayFineRequest(FineId: fine.Id, LibrarianId: 10, PaymentMethod: PaymentMethod.BankTransfer);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Phiếu phạt đã được thanh toán hoặc hủy");
    }

    [Fact]
    public async Task Handle_Should_Pay_Fine_And_Create_Payment_Record_When_Valid()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateBillingDbContext();
        var fine = new Fine
        {
            AccountId = 1,
            Amount = 75000,
            FineType = FineType.Overdue,
            Status = FineStatus.Unpaid
        };
        db.Fines.Add(fine);
        await db.SaveChangesAsync();

        var handler = new PayFineHandler(db, new PayFineValidator());
        var request = new PayFineRequest(FineId: fine.Id, LibrarianId: 5, PaymentMethod: PaymentMethod.Cash, Notes: "Đã thu tiền mặt tại quầy");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeTrue();

        fine.Status.Should().Be(FineStatus.Paid);
        fine.UpdatedBy.Should().Be(5);
        fine.UpdatedAt.Should().NotBeNull();

        var payment = db.FinePayments.FirstOrDefault(p => p.FineId == fine.Id);
        payment.Should().NotBeNull();
        payment!.Amount.Should().Be(75000);
        payment.LibrarianId.Should().Be(5);
        payment.PaymentMethod.Should().Be(PaymentMethod.Cash);
        payment.Notes.Should().Be("Đã thu tiền mặt tại quầy");
    }
}
