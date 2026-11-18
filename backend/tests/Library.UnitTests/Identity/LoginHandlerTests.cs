using FluentAssertions;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Features.Login;
using Library.Modules.Core.Identity.Services;
using Library.UnitTests.TestHelpers;
using Microsoft.Extensions.Configuration;
using NSubstitute;

namespace Library.UnitTests.Identity;

public class LoginHandlerTests
{
    private readonly JwtTokenService _jwt;

    public LoginHandlerTests()
    {
        var config = Substitute.For<IConfiguration>();
        config["JwtSettings:SecretKey"].Returns("SuperSecretKeyForLibraryTestingMustBeAtLeast32Chars!");
        config["JwtSettings:Issuer"].Returns("LibrarySystem");
        config["JwtSettings:Audience"].Returns("LibrarySystemClient");
        config["JwtSettings:AccessTokenExpiryMinutes"].Returns("60");
        config["JwtSettings:RefreshTokenExpiryDays"].Returns("7");

        _jwt = new JwtTokenService(config);
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Account_Does_Not_Exist()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var handler = new LoginHandler(db, new LoginValidator(), _jwt);
        var request = new LoginRequest("nonexistent_user", "Password123!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tên đăng nhập hoặc mật khẩu không đúng");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Account_Is_Locked()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "locked_user",
            Email = "locked@library.vn",
            FullName = "Locked Reader",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = AccountRole.Reader,
            Status = AccountStatus.Locked
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var handler = new LoginHandler(db, new LoginValidator(), _jwt);
        var request = new LoginRequest("locked_user", "Password123!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tài khoản đã bị khóa");
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Password_Is_Incorrect()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "valid_user",
            Email = "valid@library.vn",
            FullName = "Valid Reader",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
            Role = AccountRole.Reader,
            Status = AccountStatus.Active
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var handler = new LoginHandler(db, new LoginValidator(), _jwt);
        var request = new LoginRequest("valid_user", "WrongPassword999!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Tên đăng nhập hoặc mật khẩu không đúng");
    }

    [Fact]
    public async Task Handle_Should_Succeed_And_Return_Tokens_When_Credentials_Are_Valid()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateIdentityDbContext();
        var account = new Account
        {
            Username = "active_reader",
            Email = "reader@library.vn",
            FullName = "Active Reader",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SecretPassword123!"),
            Role = AccountRole.Reader,
            Status = AccountStatus.Active
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var handler = new LoginHandler(db, new LoginValidator(), _jwt);
        var request = new LoginRequest("active_reader", "SecretPassword123!");

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Username.Should().Be("active_reader");
        result.Data.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.Data.Role.Should().Be(AccountRole.Reader.ToString());

        var session = db.LoginSessions.FirstOrDefault(s => s.AccountId == account.Id);
        session.Should().NotBeNull();
    }
}

