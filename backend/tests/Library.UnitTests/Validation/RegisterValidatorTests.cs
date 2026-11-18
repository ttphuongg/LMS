using FluentAssertions;
using Library.Modules.Core.Identity.Features.Register;
using Xunit;

namespace Library.UnitTests.Validation;

public class RegisterValidatorTests
{
    private readonly RegisterValidator _validator = new();

    [Fact]
    public void Should_Pass_When_RegisterRequest_Is_Valid()
    {
        // Arrange
        var request = new RegisterRequest(
            Username: "reader_test01",
            Password: "Password@123",
            FullName: "Nguyễn Văn A",
            Email: "reader01@gmail.com",
            PhoneNumber: "0912345678"
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("ab")] // ít hơn 3 ký tự
    [InlineData("user@name!")] // chứa ký tự đặc biệt
    public void Should_Fail_When_Username_Is_Invalid(string username)
    {
        // Arrange
        var request = new RegisterRequest(
            Username: username,
            Password: "Password@123",
            FullName: "Nguyễn Văn A",
            Email: "reader01@gmail.com",
            PhoneNumber: "0912345678"
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterRequest.Username));
    }

    [Theory]
    [InlineData("")]
    [InlineData("email-sai-dinh-dang")]
    [InlineData("email@@domain..com")]
    public void Should_Fail_When_Email_Is_Invalid(string email)
    {
        // Arrange
        var request = new RegisterRequest(
            Username: "reader_test01",
            Password: "Password@123",
            FullName: "Nguyễn Văn A",
            Email: email,
            PhoneNumber: "0912345678"
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterRequest.Email));
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")] // ít hơn 6 ký tự
    public void Should_Fail_When_Password_Is_Too_Short(string password)
    {
        // Arrange
        var request = new RegisterRequest(
            Username: "reader_test01",
            Password: password,
            FullName: "Nguyễn Văn A",
            Email: "reader01@gmail.com",
            PhoneNumber: "0912345678"
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void Should_Fail_When_FullName_Is_Empty()
    {
        // Arrange
        var request = new RegisterRequest(
            Username: "reader_test01",
            Password: "Password@123",
            FullName: "",
            Email: "reader01@gmail.com",
            PhoneNumber: "0912345678"
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterRequest.FullName));
    }
}

