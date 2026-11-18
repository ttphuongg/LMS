using FluentAssertions;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Catalog.Features.UpdateBookStatus;
using Library.UnitTests.TestHelpers;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Library.UnitTests.Catalog;

public class UpdateBookStatusHandlerTests
{
    private readonly CatalogDbContext _db = TestDbContextFactory.CreateCatalogDbContext();
    private readonly UpdateBookStatusValidator _validator = new();

    [Fact]
    public async Task Should_Update_Status_To_Inactive_When_No_Copies_Are_Borrowed()
    {
        // Arrange
        var book = new Book
        {
            Title = "Sách Văn Học",
            Status = BookStatus.Active
        };
        book.Copies.Add(new BookCopy { Barcode = "COPY-01", Status = CopyStatus.Available });
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var handler = new UpdateBookStatusHandler(_db, _validator);
        var request = new UpdateBookStatusRequest(book.Id, BookStatus.Inactive);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().BeTrue();

        var updatedBook = await _db.Books.FindAsync(book.Id);
        updatedBook!.Status.Should().Be(BookStatus.Inactive);
    }

    [Fact]
    public async Task Should_Fail_To_Deactivate_When_Book_Has_Borrowed_Copies()
    {
        // Arrange
        var book = new Book
        {
            Title = "Sách Đang Cho Mượn",
            Status = BookStatus.Active
        };
        book.Copies.Add(new BookCopy { Barcode = "COPY-BORROWED", Status = CopyStatus.Borrowed });
        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        var handler = new UpdateBookStatusHandler(_db, _validator);
        var request = new UpdateBookStatusRequest(book.Id, BookStatus.Inactive);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Không thể ngừng lưu hành đầu sách đang có bản sao được mượn hoặc đặt trước");

        var bookInDb = await _db.Books.FindAsync(book.Id);
        bookInDb!.Status.Should().Be(BookStatus.Active);
    }

    [Fact]
    public async Task Should_Fail_When_Book_Does_Not_Exist()
    {
        // Arrange
        var handler = new UpdateBookStatusHandler(_db, _validator);
        var request = new UpdateBookStatusRequest(99999, BookStatus.Inactive);

        // Act
        var result = await handler.Handle(request, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("không tồn tại");
    }
}

