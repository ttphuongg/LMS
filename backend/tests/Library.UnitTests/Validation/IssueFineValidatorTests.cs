using FluentAssertions;
using Library.Modules.Core.Billing.Contracts;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Billing.Features.IssueFine;
using Xunit;

namespace Library.UnitTests.Validation;

public class IssueFineValidatorTests
{
    private readonly IssueFineValidator _validator = new();

    [Fact]
    public void Should_Pass_When_IssueFineRequest_Is_Valid()
    {
        // Arrange
        var request = new IssueFineRequest(
            AccountId: 10,
            LoanSlipDetailId: null,
            IncidentId: null,
            FineType: FineType.Other,
            Amount: 50000,
            PaymentDueDate: DateOnly.FromDateTime(DateTime.Today.AddDays(7))
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10000)]
    public void Should_Fail_When_Amount_Is_Zero_Or_Negative(decimal amount)
    {
        // Arrange
        var request = new IssueFineRequest(
            AccountId: 10,
            LoanSlipDetailId: null,
            IncidentId: null,
            FineType: FineType.Overdue,
            Amount: amount,
            PaymentDueDate: null
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(IssueFineRequest.Amount));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Should_Fail_When_AccountId_Is_Invalid(int accountId)
    {
        // Arrange
        var request = new IssueFineRequest(
            AccountId: accountId,
            LoanSlipDetailId: null,
            IncidentId: null,
            FineType: FineType.Other,
            Amount: 50000,
            PaymentDueDate: null
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(IssueFineRequest.AccountId));
    }
}
