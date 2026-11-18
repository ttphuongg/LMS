using FluentAssertions;
using Library.Modules.Core.Catalog.Contracts;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Contracts;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Circulation.Features.ReturnBook;
using Library.UnitTests.TestHelpers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Circulation;

public class ReturnBookHandlerTests
{
    private readonly CirculationDbContext _db = TestDbContextFactory.CreateCirculationDbContext();
    private readonly ReturnBookValidator _validator = new();
    private readonly ISender _sender = Substitute.For<ISender>();
    private readonly IMediator _mediator = Substitute.For<IMediator>();

    [Fact]
    public async Task Handle_Should_Complete_Loan_When_All_Copies_Are_Returned()
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
            BookCopyId = 200,
            Status = LoanDetailStatus.Borrowing
        };
        _db.LoanSlips.Add(loanSlip);
        _db.LoanSlipDetails.Add(detail);
        await _db.SaveChangesAsync();

        var copyMap = new Dictionary<int, CopyInfo>
        {
            [200] = new CopyInfo(200, "BC-200", 1, "Sách C#", true, CopyCondition.Good, CopyStatus.Borrowed, "Kệ 1")
        };
        _sender.Send(Arg.Any<GetCopyInfosQuery>(), Arg.Any<CancellationToken>())
            .Returns(copyMap);

        var handler = new ReturnBookHandler(_db, _sender, _validator, _mediator);
        var request = new ReturnBookRequest(
            LoanSlipId: loanSlip.Id,
            LibrarianId: 10,
            ReturnedCopies: [
                new ReturnedCopy(detail.Id, "Trả sách đúng hạn", CopyCondition.Good)
            ]
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();

        var updatedLoan = await _db.LoanSlips.Include(l => l.Details).FirstAsync(l => l.Id == loanSlip.Id);
        updatedLoan.Status.Should().Be(LoanStatus.Returned);
        updatedLoan.Details.First().Status.Should().Be(LoanDetailStatus.Returned);
        updatedLoan.Details.First().ActualReturnDate.Should().NotBeNull();

        await _sender.Received(1).Send(
            Arg.Is<ReleaseCopyCommand>(c => c.CopyId == 200),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task Handle_Should_Keep_LoanSlip_Borrowing_When_Partial_Returned()
    {
        // Arrange
        var loanSlip = new LoanSlip
        {
            AccountId = 1,
            DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(7)),
            Status = LoanStatus.Borrowing
        };
        var detail1 = new LoanSlipDetail { LoanSlip = loanSlip, BookCopyId = 201, Status = LoanDetailStatus.Borrowing };
        var detail2 = new LoanSlipDetail { LoanSlip = loanSlip, BookCopyId = 202, Status = LoanDetailStatus.Borrowing };
        _db.LoanSlips.Add(loanSlip);
        _db.LoanSlipDetails.AddRange(detail1, detail2);
        await _db.SaveChangesAsync();

        var copyMap = new Dictionary<int, CopyInfo>
        {
            [201] = new CopyInfo(201, "BC-201", 1, "Sách C#", true, CopyCondition.Good, CopyStatus.Borrowed, "Kệ 1"),
            [202] = new CopyInfo(202, "BC-202", 1, "Sách C#", true, CopyCondition.Good, CopyStatus.Borrowed, "Kệ 1")
        };
        _sender.Send(Arg.Any<GetCopyInfosQuery>(), Arg.Any<CancellationToken>())
            .Returns(copyMap);

        var handler = new ReturnBookHandler(_db, _sender, _validator, _mediator);
        // Only return detail1
        var request = new ReturnBookRequest(
            LoanSlipId: loanSlip.Id,
            LibrarianId: 10,
            ReturnedCopies: [
                new ReturnedCopy(detail1.Id, null, CopyCondition.Good)
            ]
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();

        var updatedLoan = await _db.LoanSlips.Include(l => l.Details).FirstAsync(l => l.Id == loanSlip.Id);
        updatedLoan.Status.Should().Be(LoanStatus.Borrowing); // Still Borrowing!
        updatedLoan.Details.First(d => d.Id == detail1.Id).Status.Should().Be(LoanDetailStatus.Returned);
        updatedLoan.Details.First(d => d.Id == detail2.Id).Status.Should().Be(LoanDetailStatus.Borrowing);
    }

    [Fact]
    public async Task Handle_Should_Fail_When_LoanSlip_Not_Found()
    {
        // Arrange
        var handler = new ReturnBookHandler(_db, _sender, _validator, _mediator);
        var request = new ReturnBookRequest(
            LoanSlipId: 99999,
            LibrarianId: 10,
            ReturnedCopies: [
                new ReturnedCopy(1, null, CopyCondition.Good)
            ]
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Phiếu mượn không tồn tại");
    }
}
