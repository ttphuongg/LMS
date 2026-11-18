using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Features.ResetPassword;
using Library.UnitTests.TestHelpers;

namespace Library.UnitTests.Identity;

public class ResetPasswordHandlerTests
{
    private static string HashSha256(string input) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();

    [Fact]
    public async Task Handle_Should_Fail_When_Email_Does_Not_Exist()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var handler = new ResetPasswordHandler(db, new ResetPasswordValidator());
        var request = new ResetPasswordRequest("nonexistent@domain.com", "123456", "NewPassword123!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Mã xác thực không hợp lệ hoặc đã hết thời hạn");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Otp_Is_Expired()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "reader_otp",
            Email = "reader_otp@library.vn",
            FullName = "OTP Reader",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!"),
            Status = AccountStatus.Active
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var expiredToken = new PasswordResetToken
        {
            AccountId = account.Id,
            TokenHash = HashSha256("expired_token"),
            OtpHash = HashSha256("123456"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5) // Đã hết hạn
        };
        db.PasswordResetTokens.Add(expiredToken);
        await db.SaveChangesAsync();

        var handler = new ResetPasswordHandler(db, new ResetPasswordValidator());
        var request = new ResetPasswordRequest("reader_otp@library.vn", "123456", "NewPassword123!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("hết thời hạn sử dụng");
    }

    [Fact]
    public async Task Handle_Should_Succeed_And_Update_Password_When_Otp_Is_Valid()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "valid_otp_reader",
            Email = "valid_otp@library.vn",
            FullName = "Valid OTP Reader",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!"),
            Status = AccountStatus.Active
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var validToken = new PasswordResetToken
        {
            AccountId = account.Id,
            TokenHash = HashSha256("valid_token"),
            OtpHash = HashSha256("654321"),
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };
        db.PasswordResetTokens.Add(validToken);

        // Giả lập một session đăng nhập cũ đang mở
        var activeSession = new LoginSession
        {
            AccountId = account.Id,
            RefreshTokenHash = "old_refresh_hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.LoginSessions.Add(activeSession);
        await db.SaveChangesAsync();

        var handler = new ResetPasswordHandler(db, new ResetPasswordValidator());
        var request = new ResetPasswordRequest("valid_otp@library.vn", "654321", "BrandNewPassword123!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().Contain("Đặt lại mật khẩu thành công");

        // Kiểm tra token đã được đánh dấu used
        validToken.UsedAt.Should().NotBeNull();

        // Kiểm tra session cũ bị logout
        activeSession.LoggedOutAt.Should().NotBeNull();

        // Kiểm tra mật khẩu mới đã băm và khớp
        BCrypt.Net.BCrypt.Verify("BrandNewPassword123!", account.PasswordHash).Should().BeTrue();
    }
}

