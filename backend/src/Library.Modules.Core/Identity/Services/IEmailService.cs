namespace Library.Modules.Core.Identity.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, string otpCode, CancellationToken ct = default);
}

