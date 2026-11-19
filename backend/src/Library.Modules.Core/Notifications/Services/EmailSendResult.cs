namespace Library.Modules.Core.Notifications.Services;

public enum EmailFailureType
{
    None = 0,
    ConfigurationMissing, // Chưa cấu hình SMTP (SMTP_HOST / Smtp:Host)
    ConnectionFailed,     // Không thể kết nối tới SMTP server
    AuthenticationFailed, // Sai tài khoản hoặc mật khẩu SMTP
    SendError             // Lỗi trong quá trình gửi email
}

public record EmailSendResult(
    bool Success,
    string? ErrorMessage = null,
    EmailFailureType FailureType = EmailFailureType.None
)
{
    public static EmailSendResult Ok() => new(true);

    public static EmailSendResult Failed(string errorMessage, EmailFailureType failureType) =>
        new(false, errorMessage, failureType);
}
