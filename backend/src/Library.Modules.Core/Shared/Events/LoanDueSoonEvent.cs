using MediatR;

namespace Library.Modules.Core.Shared.Events;

/// <summary>
/// Sự kiện phát ra khi phát hiện sách mượn sắp đến hạn trả trong khoảng 3 đến 5 ngày tới.
/// </summary>
public record LoanDueSoonEvent(
    long LoanSlipDetailId,
    int AccountId,
    int BookCopyId,
    DateOnly DueDate,
    int DaysUntilDue
) : INotification;

