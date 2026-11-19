namespace Library.Modules.Core.Notifications.Services;

/// <summary>
/// Dịch vụ gửi email hạ tầng của hệ thống Libri (phục vụ OTP xác thực, thông báo đặt trước, nhắc hạn, quá hạn, khóa tài khoản).
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Gửi email tổng quát với tiêu đề và nội dung HTML tùy chỉnh qua SMTP.
    /// </summary>
    Task<EmailSendResult> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default);

    /// <summary>
    /// Gửi email đặt lại mật khẩu kèm mã xác thực OTP.
    /// </summary>
    Task<EmailSendResult> SendPasswordResetEmailAsync(string toEmail, string resetToken, string otpCode, CancellationToken ct = default);

    /// <summary>
    /// Gửi email xác thực tài khoản đăng ký mới kèm mã OTP 6 chữ số.
    /// </summary>
    Task<EmailSendResult> SendRegistrationOtpEmailAsync(string toEmail, string otpCode, string? fullName = null, CancellationToken ct = default);
}

