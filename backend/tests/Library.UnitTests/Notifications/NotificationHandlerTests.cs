using FluentAssertions;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Notifications.Features.MarkAsRead;
using Library.Modules.Core.Notifications.Features.SendNotification;
using Library.UnitTests.TestHelpers;

namespace Library.UnitTests.Notifications;

public class NotificationHandlerTests
{
    [Fact]
    public async Task SendNotification_Should_Create_Record_And_Return_Id()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateNotificationsDbContext();
        var handler = new SendNotificationHandler(db);
        var request = new SendNotificationRequest(
            AccountId: 1,
            Title: "Nhắc nhở trả sách",
            Content: "Sách 'Clean Code' của bạn sắp đến hạn hoàn trả.",
            NotificationType: NotificationType.Borrow
        );

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeGreaterThan(0);

        var notification = db.Notifications.FirstOrDefault(n => n.Id == result.Data);
        notification.Should().NotBeNull();
        notification!.AccountId.Should().Be(1);
        notification.Title.Should().Be("Nhắc nhở trả sách");
        notification.IsRead.Should().BeFalse();
        notification.NotificationType.Should().Be(NotificationType.Borrow);
    }

    [Fact]
    public async Task MarkAsRead_Should_Fail_When_Notification_Does_Not_Exist_Or_Wrong_Account()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateNotificationsDbContext();
        var notif = new Notification
        {
            AccountId = 1, // Thuộc về account 1
            Title = "Thư viện thông báo",
            Content = "Nội dung",
            NotificationType = NotificationType.System,
            IsRead = false
        };
        db.Notifications.Add(notif);
        await db.SaveChangesAsync();

        var handler = new MarkAsReadHandler(db, new MarkAsReadValidator());
        // Account 2 cố tình đánh dấu đã đọc thông báo của Account 1
        var request = new MarkAsReadRequest(NotificationId: notif.Id, AccountId: 2);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Notification not found or access denied");
    }

    [Fact]
    public async Task MarkAsRead_Should_Succeed_When_Notification_Belongs_To_Account()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateNotificationsDbContext();
        var notif = new Notification
        {
            AccountId = 1,
            Title = "Phiếu mượn thành công",
            Content = "Bạn đã mượn thành công 2 cuốn sách.",
            NotificationType = NotificationType.Borrow,
            IsRead = false
        };
        db.Notifications.Add(notif);
        await db.SaveChangesAsync();

        var handler = new MarkAsReadHandler(db, new MarkAsReadValidator());
        var request = new MarkAsReadRequest(NotificationId: notif.Id, AccountId: 1);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeTrue();

        notif.IsRead.Should().BeTrue();
    }
}

