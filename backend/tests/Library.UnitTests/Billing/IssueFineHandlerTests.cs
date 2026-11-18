using FluentAssertions;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Shared.Events;
using Library.UnitTests.TestHelpers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Billing;

public class IssueFineHandlerTests
{
    private readonly BillingDbContext _db = TestDbContextFactory.CreateBillingDbContext();
    private readonly IssueFineValidator _validator = new();
    private readonly IMediator _mediator = Substitute.For<IMediator>();

    [Fact]
    public async Task Handle_Should_Create_Fine_And_Publish_Event_When_Valid()
    {
        // Arrange
        var handler = new IssueFineHandler(_db, _validator, _mediator);
        var request = new IssueFineRequest(
            AccountId: 10,
            LoanSlipDetailId: null,
            IncidentId: null,
            FineType: FineType.Other,
            Amount: 30000,
            PaymentDueDate: DateOnly.FromDateTime(DateTime.Today.AddDays(10))
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var createdFine = await _db.Fines.FirstOrDefaultAsync(f => f.Id == result.Data);
        createdFine.Should().NotBeNull();
        createdFine!.Amount.Should().Be(30000);
        createdFine.Status.Should().Be(FineStatus.Unpaid);
        createdFine.AccountId.Should().Be(10);

        // Verify event was published
        await _mediator.Received(1).Publish(
            Arg.Is<FineIssuedEvent>(e => e.AccountId == 10 && e.Amount == 30000),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Amount_Is_Negative()
    {
        // Arrange
        var handler = new IssueFineHandler(_db, _validator, _mediator);
        var request = new IssueFineRequest(
            AccountId: 10,
            LoanSlipDetailId: null,
            IncidentId: null,
            FineType: FineType.Other,
            Amount: -5000,
            PaymentDueDate: null
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Số tiền phạt phải lớn hơn 0");

        var finesCount = await _db.Fines.CountAsync();
        finesCount.Should().Be(0);
    }
}
