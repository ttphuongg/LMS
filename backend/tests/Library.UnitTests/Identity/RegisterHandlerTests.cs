using FluentAssertions;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Features.Register;
using Library.Modules.Core.Notifications.Services;
using Library.UnitTests.TestHelpers;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Identity;

public class RegisterHandlerTests
{
    private static IConfiguration CreateTestConfig() =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "SuperSecretKeyForTestingRegistrationSessionToken123456!"
        }).Build();

    [Fact]
    public async Task Register_Should_Create_Inactive_Account_And_Send_Otp()
    {
        // 1. Đăng ký lần đầu thành công và chuyển sang OTP
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();
        emailService.SendRegistrationOtpEmailAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(EmailSendResult.Ok()));

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService, CreateTestConfig());
        var request = new RegisterRequest(
            Username: "reader_new",
            FullName: "Nguyễn Văn Mới",
            Email: "newreader@domain.com",
            Password: "Password123!",
            PhoneNumber: "0987654321"
        );

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Email.Should().Be("newreader@domain.com");
        result.Data.RegistrationToken.Should().NotBeNullOrEmpty();
        result.Data.EmailSent.Should().BeTrue();

        var createdAccount = db.Accounts.FirstOrDefault(a => a.Email == "newreader@domain.com");
        createdAccount.Should().NotBeNull();
        createdAccount!.Status.Should().Be(AccountStatus.Inactive);

        var createdOtp = db.EmailVerificationOtps.FirstOrDefault(o => o.AccountId == createdAccount.Id);
        createdOtp.Should().NotBeNull();
        createdOtp!.FailedAttempts.Should().Be(0);
        createdOtp.IsUsed.Should().BeFalse();

        await emailService.Received(1).SendRegistrationOtpEmailAsync("newreader@domain.com", Arg.Any<string>(), "Nguyễn Văn Mới", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_Should_Fail_When_Active_Email_Already_Exists()
    {
        // 6. Đăng ký trùng tài khoản đã Active (Email)
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();

        db.Accounts.Add(new Account
        {
            Username = "existing_user",
            Email = "existing@domain.com",
            FullName = "Existing User",
            PasswordHash = "hash",
            Status = AccountStatus.Active
        });
        await db.SaveChangesAsync();

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService, CreateTestConfig());
        var request = new RegisterRequest(
            Username: "another_user",
            FullName: "Another Name",
            Email: "existing@domain.com",
            Password: "Password123!"
        );

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Email đã được sử dụng");
    }

    [Fact]
    public async Task Register_Should_Fail_When_Active_Username_Already_Exists()
    {
        // 6. Đăng ký trùng tài khoản đã Active (Username)
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();

        db.Accounts.Add(new Account
        {
            Username = "active_username",
            Email = "active_user@domain.com",
            FullName = "Active Username",
            PasswordHash = "hash",
            Status = AccountStatus.Active
        });
        await db.SaveChangesAsync();

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService, CreateTestConfig());
        var request = new RegisterRequest(
            Username: "active_username",
            FullName: "New Person",
            Email: "diff_email@domain.com",
            Password: "Password123!"
        );

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tên đăng nhập đã tồn tại");
    }

    [Fact]
    public async Task Register_Should_Not_Allow_Takeover_Of_Inactive_Account_Without_Token()
    {
        // 7. Không thể chiếm tài khoản Inactive của người khác (khi không có session token hợp lệ)
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();

        db.Accounts.Add(new Account
        {
            Username = "victim_user",
            Email = "victim@domain.com",
            FullName = "Victim User",
            PasswordHash = "victim_hash",
            Status = AccountStatus.Inactive
        });
        await db.SaveChangesAsync();

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService, CreateTestConfig());

        // Kẻ tấn công cố gắng đăng ký lại username của người khác mà không có token
        var attackRequest = new RegisterRequest(
            Username: "victim_user",
            FullName: "Attacker",
            Email: "attacker@domain.com",
            Password: "AttackerPassword123!"
        );

        var result = await handler.Handle(attackRequest, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tên đăng nhập đã tồn tại");

        // Đảm bảo thông tin của tài khoản Inactive ban đầu không bị ghi đè
        var victim = db.Accounts.First(a => a.Username == "victim_user");
        victim.Email.Should().Be("victim@domain.com");
        victim.FullName.Should().Be("Victim User");
    }

    [Fact]
    public async Task Register_Should_Allow_Updating_Pending_Registration_With_Valid_Session_Token()
    {
        // 5. Thay đổi thông tin trong phiên đăng ký đang chờ xác thực (có session token)
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();
        emailService.SendRegistrationOtpEmailAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(EmailSendResult.Ok()));

        var config = CreateTestConfig();
        var secretKey = config["JwtSettings:SecretKey"]!;

        var initialAccount = new Account
        {
            Username = "first_username",
            Email = "first_email@domain.com",
            FullName = "First Name",
            PasswordHash = "initial_hash",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(initialAccount);
        await db.SaveChangesAsync();

        // Tạo token hợp lệ cho phiên này
        var validToken = RegistrationTokenHelper.GenerateToken(initialAccount.Id, initialAccount.Email, secretKey);

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService, config);

        // Người dùng quay lại form và sửa email + họ tên
        var updateRequest = new RegisterRequest(
            Username: "first_username",
            FullName: "Updated Full Name",
            Email: "corrected_email@domain.com",
            Password: "NewPassword123!",
            PhoneNumber: "0912345678",
            RegistrationToken: validToken
        );

        var result = await handler.Handle(updateRequest, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Email.Should().Be("corrected_email@domain.com");

        var updatedAccount = db.Accounts.First(a => a.Id == initialAccount.Id);
        updatedAccount.Email.Should().Be("corrected_email@domain.com");
        updatedAccount.FullName.Should().Be("Updated Full Name");
        updatedAccount.PhoneNumber.Should().Be("0912345678");

        // Mã OTP mới được gửi đến email đã sửa
        await emailService.Received(1).SendRegistrationOtpEmailAsync("corrected_email@domain.com", Arg.Any<string>(), "Updated Full Name", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_Should_Handle_Email_Dispatch_Failure_Gracefully()
    {
        // 8. Gửi email thất bại và thử lại: tài khoản vẫn được tạo nhưng trả về EmailSent = false kèm chi tiết lỗi
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();
        emailService.SendRegistrationOtpEmailAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(EmailSendResult.Failed("Kết nối tới SMTP mail.libri.id.vn:587 bị từ chối", EmailFailureType.ConnectionFailed)));

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService, CreateTestConfig());
        var request = new RegisterRequest(
            Username: "reader_mail_fail",
            FullName: "Thử Thất Bại Mail",
            Email: "fail_email@domain.com",
            Password: "Password123!",
            PhoneNumber: "0987654321"
        );

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.EmailSent.Should().BeFalse();
        result.Data.EmailError.Should().Contain("Kết nối tới SMTP");
        result.Data.RegistrationToken.Should().NotBeNullOrEmpty();

        // Tài khoản Inactive vẫn được tạo an toàn trong DB
        var account = db.Accounts.FirstOrDefault(a => a.Email == "fail_email@domain.com");
        account.Should().NotBeNull();
        account!.Status.Should().Be(AccountStatus.Inactive);
    }
}
