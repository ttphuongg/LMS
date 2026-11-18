using FluentAssertions;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Features.ReportIncident;
using Library.UnitTests.TestHelpers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Circulation;

public class ReportIncidentHandlerTests
{
    private readonly CirculationDbContext _db = TestDbContextFactory.CreateCirculationDbContext();
    private readonly ReportIncidentValidator _validator = new();
    private readonly ISender _sender = Substitute.For<ISender>();
    private readonly IMediator _mediator = Substitute.For<IMediator>();

    [Fact]
    public async Task Handle_Should_Set_Detail_To_Lost_And_Record_Incident_When_Type_Is_Lost()
    {
        // Arrange
        var loanSlip = new LoanSlip
        {
            AccountId = 1,
            DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(7)),
            Status = LoanStatus.Borrowing
        };
        var detail = new LoanSlipDetail
        {
            LoanSlip = loanSlip,
            BookCopyId = 100,
            Status = LoanDetailStatus.Borrowing
        };
        _db.LoanSlips.Add(loanSlip);
        _db.LoanSlipDetails.Add(detail);
        await _db.SaveChangesAsync();

        var handler = new ReportIncidentHandler(_db, _sender, _validator, _mediator);
        var request = new ReportIncidentRequest(
            LoanSlipDetailId: detail.Id,
            LibrarianId: 99,
            IncidentType: IncidentType.Lost,
            Severity: IncidentSeverity.TotalLoss,
            CompensationAmount: 200000,
            Description: "Làm mất sách"
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var updatedDetail = await _db.LoanSlipDetails.FindAsync(detail.Id);
        updatedDetail!.Status.Should().Be(LoanDetailStatus.Lost);
        updatedDetail.ActualReturnDate.Should().NotBeNull();

        await _sender.Received(1).Send(
            Arg.Is<SetCopyStatusCommand>(c => c.CopyId == 100 && c.NewStatus == CopyStatus.Lost),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task Handle_Should_Set_Detail_To_Damaged_And_Record_Incident_When_Type_Is_Damaged()
    {
        // Arrange
        var loanSlip = new LoanSlip
        {
            AccountId = 1,
            DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(7)),
            Status = LoanStatus.Borrowing
        };
        var detail = new LoanSlipDetail
        {
            LoanSlip = loanSlip,
            BookCopyId = 101,
            Status = LoanDetailStatus.Borrowing
        };
        _db.LoanSlips.Add(loanSlip);
        _db.LoanSlipDetails.Add(detail);
        await _db.SaveChangesAsync();

        var handler = new ReportIncidentHandler(_db, _sender, _validator, _mediator);
        var request = new ReportIncidentRequest(
            LoanSlipDetailId: detail.Id,
            LibrarianId: 99,
            IncidentType: IncidentType.Damaged,
            Severity: IncidentSeverity.Minor,
            CompensationAmount: 50000,
            Description: "Rách vài trang"
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();

        var updatedDetail = await _db.LoanSlipDetails.FindAsync(detail.Id);
        updatedDetail!.Status.Should().Be(LoanDetailStatus.Damaged);
        updatedDetail.ActualReturnDate.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_Should_Fail_When_LoanDetail_Does_Not_Exist()
    {
        // Arrange
        var handler = new ReportIncidentHandler(_db, _sender, _validator, _mediator);
        var request = new ReportIncidentRequest(
            LoanSlipDetailId: 99999,
            LibrarianId: 99,
            IncidentType: IncidentType.Lost,
            Severity: IncidentSeverity.TotalLoss,
            CompensationAmount: 200000,
            Description: "Không tồn tại"
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Chi tiết phiếu mượn không tồn tại");
    }
}

