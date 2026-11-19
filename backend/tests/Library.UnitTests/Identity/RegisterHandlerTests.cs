using FluentAssertions;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Features.Register;
using Library.Modules.Core.Notifications.Services;
using Library.UnitTests.TestHelpers;
using NSubstitute;
using Xunit;

namespace Library.UnitTests.Identity;

public class RegisterHandlerTests
{
    [Fact]
    public async Task Register_Should_Create_Inactive_Account_And_Send_Otp()
    {
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var emailService = Substitute.For<IEmailService>();

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService);
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

        var handler = new RegisterHandler(db, new RegisterValidator(), emailService);
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
}
