using MediatR;

namespace Library.Modules.Core.Shared.Events;

public record LoanOverdueEvent(
    long LoanSlipDetailId,
    int AccountId,
    int BookCopyId,
    DateOnly DueDate
) : INotification;
