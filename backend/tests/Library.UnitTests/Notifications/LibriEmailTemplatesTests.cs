using FluentAssertions;
using Library.Modules.Core.Notifications.Services;
using Xunit;

namespace Library.UnitTests.Notifications;

public class LibriEmailTemplatesTests
{
    [Fact]
    public void BuildRegistrationOtpEmail_Should_Render_GitHub_Style_And_Libri_Branding()
    {
        // Arrange
        var toEmail = "reader@domain.com";
        var otpCode = "847291";
        var fullName = "Nguyễn Văn Đọc";

        // Act
        var html = LibriEmailTemplates.BuildRegistrationOtpEmail(toEmail, otpCode, fullName);

        // Assert
        // 1. Logo chỉ sử dụng chữ "LIBRI", không dùng icon/ảnh
        html.Should().Contain("LIBRI");
        html.Should().NotContain("<img");
        html.Should().NotContain("svg");

        // 2. Màu sắc chủ đạo và nền
        html.Should().Contain("#073D2B"); // Màu xanh đậm thương hiệu
        html.Should().Contain("#f6f8fa"); // Nền xám nhạt

        // 3. Tiêu đề mục đích email
        html.Should().Contain("Xác thực tài khoản Libri");

        // 4. Lời chào và họ tên người nhận
        html.Should().Contain("Nguyễn Văn Đọc");

        // 5. Mã OTP và thời hạn 3 phút
        html.Should().Contain("847291");
        html.Should().Contain("3 phút");

        // 6. Chữ ký đội ngũ Libri
        html.Should().Contain("Đội ngũ Libri");

        // 7. Lưu ý bảo mật
        html.Should().Contain("Tuyệt đối không chia sẻ mã này");
    }

    [Fact]
    public void BuildRegistrationOtpEmail_Should_HtmlEncode_User_Inputs()
    {
        // Arrange
        var maliciousName = "<script>alert('xss')</script> Nguyễn";
        var otpCode = "123456";

        // Act
        var html = LibriEmailTemplates.BuildRegistrationOtpEmail("user@domain.com", otpCode, maliciousName);

        // Assert
        html.Should().NotContain("<script>");
        html.Should().Contain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    }

    [Fact]
    public void BuildPasswordResetEmail_Should_Render_Otp_And_Reset_Button()
    {
        // Arrange
        var toEmail = "reset_user@domain.com";
        var otpCode = "998877";
        var resetLink = "https://libri.id.vn/reset-password?email=reset_user%40domain.com&otp=998877";

        // Act
        var html = LibriEmailTemplates.BuildPasswordResetEmail(toEmail, otpCode, resetLink, "Trần Thị B");

        // Assert
        // 1. Tiêu đề
        html.Should().Contain("Đặt lại mật khẩu Libri");

        // 2. Họ tên và email
        html.Should().Contain("Trần Thị B");
        html.Should().Contain("reset_user@domain.com");

        // 3. Mã OTP và thời hạn 15 phút
        html.Should().Contain("998877");
        html.Should().Contain("15 phút");

        // 4. Nút bấm và liên kết đặt lại mật khẩu
        html.Should().Contain("href=\"https://libri.id.vn/reset-password?email=reset_user%40domain.com&amp;otp=998877\"");
        html.Should().Contain("Đặt lại mật khẩu");

        // 5. Chữ ký
        html.Should().Contain("Đội ngũ Libri");
    }

    [Fact]
    public void BuildPasswordResetEmail_Should_HtmlEncode_User_Inputs()
    {
        // Arrange
        var maliciousEmail = "test\"onclick=\"alert(1)\"@domain.com";
        var maliciousName = "<b>Hacker</b>";
        var otpCode = "654321";
        var resetLink = "https://libri.id.vn/reset?token=<script>";

        // Act
        var html = LibriEmailTemplates.BuildPasswordResetEmail(maliciousEmail, otpCode, resetLink, maliciousName);

        // Assert
        html.Should().NotContain("<b>Hacker</b>");
        html.Should().Contain("&lt;b&gt;Hacker&lt;/b&gt;");
        html.Should().NotContain("<script>");
        html.Should().Contain("&lt;script&gt;");
    }
}
