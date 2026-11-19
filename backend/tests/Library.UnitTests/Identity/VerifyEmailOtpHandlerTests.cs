using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Features.Login;
using Library.Modules.Core.Identity.Features.ResendEmailOtp;
using Library.Modules.Core.Identity.Features.VerifyEmailOtp;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Notifications.Services;
using Library.UnitTests.TestHelpers;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Identity;

public class VerifyEmailOtpHandlerTests
{
    private static string HashSha256(string input) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();

    [Fact]
    public async Task Verify_Should_Fail_When_Account_Does_Not_Exist()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var handler = new VerifyEmailOtpHandler(db, new VerifyEmailOtpValidator());
        var request = new VerifyEmailOtpRequest("nonexistent@domain.com", "123456");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tài khoản không tồn tại");
    }

    [Fact]
    public async Task Verify_Should_Fail_When_Account_Already_Active()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "active_user",
            Email = "active@domain.com",
            FullName = "Active User",
            PasswordHash = "hashed",
            Status = AccountStatus.Active
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var handler = new VerifyEmailOtpHandler(db, new VerifyEmailOtpValidator());
        var request = new VerifyEmailOtpRequest("active@domain.com", "123456");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("đã được xác thực và kích hoạt");
    }

    [Fact]
    public async Task Verify_Should_Fail_When_Otp_Is_Expired()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "unverified_user",
            Email = "unverified@domain.com",
            FullName = "Unverified User",
            PasswordHash = "hashed",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var otp = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = HashSha256("123456"),
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-2), // Hết hạn
            FailedAttempts = 0
        };
        db.EmailVerificationOtps.Add(otp);
        await db.SaveChangesAsync();

        var handler = new VerifyEmailOtpHandler(db, new VerifyEmailOtpValidator());
        var request = new VerifyEmailOtpRequest("unverified@domain.com", "123456");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("hết hạn");
    }

    [Fact]
    public async Task Verify_Should_Increment_FailedAttempts_When_Otp_Is_Wrong()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "wrong_otp_user",
            Email = "wrong_otp@domain.com",
            FullName = "Wrong Otp User",
            PasswordHash = "hashed",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var otp = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = HashSha256("123456"),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(3),
            FailedAttempts = 0
        };
        db.EmailVerificationOtps.Add(otp);
        await db.SaveChangesAsync();

        var handler = new VerifyEmailOtpHandler(db, new VerifyEmailOtpValidator());
        var request = new VerifyEmailOtpRequest("wrong_otp@domain.com", "654321");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("không chính xác");
        result.Error.Should().Contain("4 lần thử");

        otp.FailedAttempts.Should().Be(1);
    }

    [Fact]
    public async Task Verify_Should_Lock_When_FailedAttempts_Reaches_5()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "locked_otp_user",
            Email = "locked_otp@domain.com",
            FullName = "Locked Otp User",
            PasswordHash = "hashed",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var otp = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = HashSha256("123456"),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(3),
            FailedAttempts = 4 // Lần thử thứ 5 sẽ bị lock
        };
        db.EmailVerificationOtps.Add(otp);
        await db.SaveChangesAsync();

        var handler = new VerifyEmailOtpHandler(db, new VerifyEmailOtpValidator());
        var request = new VerifyEmailOtpRequest("locked_otp@domain.com", "654321");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("nhập sai mã quá 5 lần");
        otp.IsUsed.Should().BeTrue(); // Đã bị vô hiệu hóa
    }

    [Fact]
    public async Task Verify_Should_Activate_Account_When_Otp_Is_Correct()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "success_user",
            Email = "success@domain.com",
            FullName = "Success User",
            PasswordHash = "hashed",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var otp = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = HashSha256("888999"),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(3),
            FailedAttempts = 0
        };
        db.EmailVerificationOtps.Add(otp);
        await db.SaveChangesAsync();

        var handler = new VerifyEmailOtpHandler(db, new VerifyEmailOtpValidator());
        var request = new VerifyEmailOtpRequest("success@domain.com", "888999");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeTrue();
        account.Status.Should().Be(AccountStatus.Active);
        otp.IsUsed.Should().BeTrue();

        // Thử lại OTP đã dùng -> Phải báo không thể dùng lại
        var reuseResult = await handler.Handle(request, CancellationToken.None);
        reuseResult.Success.Should().BeFalse();
    }

    [Fact]
    public async Task ResendOtp_Should_Enforce_60s_Cooldown()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();
        var account = new Account
        {
            Username = "cooldown_user",
            Email = "cooldown@domain.com",
            FullName = "Cooldown User",
            PasswordHash = "hashed",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var recentOtp = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = HashSha256("111222"),
            CreatedAt = DateTime.UtcNow.AddSeconds(-20), // Mới gửi 20 giây trước
            ExpiresAt = DateTime.UtcNow.AddMinutes(3),
            FailedAttempts = 0
        };
        db.EmailVerificationOtps.Add(recentOtp);
        await db.SaveChangesAsync();

        var handler = new ResendEmailOtpHandler(db, new ResendEmailOtpValidator(), emailService);
        var request = new ResendEmailOtpRequest("cooldown@domain.com");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("giây trước khi yêu cầu gửi lại");
    }

    [Fact]
    public async Task ResendOtp_Should_Issue_New_Otp_After_Cooldown()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();
        var account = new Account
        {
            Username = "resend_user",
            Email = "resend@domain.com",
            FullName = "Resend User",
            PasswordHash = "hashed",
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var oldOtp = new EmailVerificationOtp
        {
            AccountId = account.Id,
            Email = account.Email,
            OtpHash = HashSha256("111222"),
            CreatedAt = DateTime.UtcNow.AddSeconds(-70), // Đã quá 60s
            ExpiresAt = DateTime.UtcNow.AddMinutes(2),
            FailedAttempts = 0
        };
        db.EmailVerificationOtps.Add(oldOtp);
        await db.SaveChangesAsync();

        var handler = new ResendEmailOtpHandler(db, new ResendEmailOtpValidator(), emailService);
        var request = new ResendEmailOtpRequest("resend@domain.com");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeTrue();
        oldOtp.IsUsed.Should().BeTrue(); // Mã cũ bị vô hiệu
        await emailService.Received(1).SendRegistrationOtpEmailAsync("resend@domain.com", Arg.Any<string>(), "Resend User", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Login_Should_Fail_When_Account_Is_Inactive()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "SuperSecretKeyForTestingJwtService123456!",
            ["JwtSettings:Issuer"] = "TestIssuer",
            ["JwtSettings:Audience"] = "TestAudience",
            ["JwtSettings:AccessTokenExpiryMinutes"] = "60",
            ["JwtSettings:RefreshTokenExpiryDays"] = "7"
        }).Build();

        var jwtService = new JwtTokenService(config);

        var account = new Account
        {
            Username = "unverified_login",
            Email = "unverified_login@domain.com",
            FullName = "Unverified Login",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Status = AccountStatus.Inactive
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var handler = new LoginHandler(db, new LoginValidator(), jwtService);
        var request = new LoginRequest("unverified_login", "Password123!");

        var result = await handler.Handle(request, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("xác thực email");
    }
}
