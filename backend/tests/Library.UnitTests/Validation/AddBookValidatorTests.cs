using FluentAssertions;
using Library.Modules.Core.Catalog.Features.AddBook;
using Xunit;

namespace Library.UnitTests.Validation;

public class AddBookValidatorTests
{
    private readonly AddBookValidator _validator = new();

    [Fact]
    public void Should_Pass_When_AddBookRequest_Is_Valid()
    {
        // Arrange
        var request = new AddBookRequest(
            Title: "Lập trình C# 12 và .NET 10",
            Isbn: "978-604-0-99999-1",
            Description: "Sách lập trình nâng cao",
            PublishedYear: 2026,
            Publisher: "NXB Thông tin và Truyền thông",
            Language: "Tiếng Việt",
            PageCount: 650,
            BookValue: 180000,
            CoverImageUrl: "https://images.libri.id.vn/covers/csharp.jpg",
            AuthorIds: [1, 2],
            CategoryIds: [1]
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Should_Fail_When_Title_Is_Empty(string title)
    {
        // Arrange
        var request = new AddBookRequest(
            Title: title,
            Isbn: "978-604-0-99999-1",
            Description: null,
            PublishedYear: null,
            Publisher: null,
            Language: null,
            PageCount: null,
            BookValue: null,
            CoverImageUrl: null,
            AuthorIds: [1],
            CategoryIds: [1]
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(AddBookRequest.Title));
    }

    [Theory]
    [InlineData("ISBN!@#$")] // Ký tự đặc biệt không hợp lệ
    [InlineData("978 604 123 abc")] // Chứa chữ cái không phải X
    public void Should_Fail_When_Isbn_Contains_Invalid_Characters(string isbn)
    {
        // Arrange
        var request = new AddBookRequest(
            Title: "Sách Test ISBN",
            Isbn: isbn,
            Description: null,
            PublishedYear: null,
            Publisher: null,
            Language: null,
            PageCount: null,
            BookValue: null,
            CoverImageUrl: null,
            AuthorIds: [1],
            CategoryIds: [1]
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(AddBookRequest.Isbn));
    }

    [Theory]
    [InlineData(999)]
    [InlineData(2101)]
    public void Should_Fail_When_PublishedYear_Is_Out_Of_Range(short year)
    {
        // Arrange
        var request = new AddBookRequest(
            Title: "Sách Test Năm",
            Isbn: null,
            Description: null,
            PublishedYear: year,
            Publisher: null,
            Language: null,
            PageCount: null,
            BookValue: null,
            CoverImageUrl: null,
            AuthorIds: [1],
            CategoryIds: [1]
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(AddBookRequest.PublishedYear));
    }

    [Fact]
    public void Should_Fail_When_PageCount_Is_Zero_Or_Negative()
    {
        // Arrange
        var request = new AddBookRequest(
            Title: "Sách Test Trang",
            Isbn: null,
            Description: null,
            PublishedYear: null,
            Publisher: null,
            Language: null,
            PageCount: 0,
            BookValue: null,
            CoverImageUrl: null,
            AuthorIds: [1],
            CategoryIds: [1]
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(AddBookRequest.PageCount));
    }
}

