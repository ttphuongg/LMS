namespace Library.Modules.Core.Identity.Services;

public interface IEmailService
{
    /// <summary>
    /// Gửi email tổng quát với tiêu đề và nội dung HTML tùy chỉnh.
    /// </summary>
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default);

    /// <summary>
    /// Gửi email đặt lại mật khẩu kèm mã xác thực OTP.
    /// </summary>
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, string otpCode, CancellationToken ct = default);
}

