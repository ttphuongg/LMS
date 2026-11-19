using System.Net;

namespace Library.Modules.Core.Notifications.Services;

/// <summary>
/// Trình tạo mẫu HTML email theo phong cách tối giản, hiện đại (tham khảo GitHub), nhận diện thương hiệu LIBRI (#073D2B).
/// Sử dụng bảng (table-based) và inline CSS để tương thích tối đa với Gmail, Outlook và các email client phổ biến.
/// </summary>
public static class LibriEmailTemplates
{
    private const string BrandColor = "#073D2B";
    private const string CanvasBackground = "#f6f8fa";
    private const string CardBackground = "#ffffff";
    private const string BorderColor = "#d0d7de";
    private const string TextColor = "#24292f";
    private const string MutedTextColor = "#57606a";
    private const string DividerColor = "#eaeef2";

    /// <summary>
    /// Khung bọc email dùng chung (GitHub style layout):
    /// Nền xám nhạt #f6f8fa, thẻ card trắng ở giữa với viền mảnh, logo chữ "LIBRI" viết hoa typography sang trọng.
    /// Không chứa hình ảnh, icon hoặc biểu tượng cuốn sách.
    /// </summary>
    public static string BuildBaseCard(string title, string bodyContent)
    {
        var safeTitle = WebUtility.HtmlEncode(title);

        return $$"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{safeTitle}}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: {{CanvasBackground}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; color: {{TextColor}}; -webkit-font-smoothing: antialiased;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: {{CanvasBackground}}; width: 100%; padding: 40px 16px;">
            <tr>
              <td align="center">
                <!-- Khung nội dung chính (White Card) -->
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; width: 100%; background-color: {{CardBackground}}; border: 1px solid {{BorderColor}}; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(31,35,40,0.04);">
                  <!-- Logo chữ "LIBRI" căn giữa, không icon/ảnh -->
                  <tr>
                    <td align="center" style="padding: 32px 32px 18px 32px;">
                      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; letter-spacing: 6px; color: {{BrandColor}}; text-decoration: none; display: inline-block;">LIBRI</span>
                      <div style="height: 1px; background-color: {{DividerColor}}; margin-top: 18px;"></div>
                    </td>
                  </tr>
                  <!-- Thân email -->
                  <tr>
                    <td style="padding: 0 32px 32px 32px;">
                      {{bodyContent}}
                    </td>
                  </tr>
                </table>

                <!-- Chân trang phụ ngoài card -->
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; width: 100%; margin-top: 24px;">
                  <tr>
                    <td align="center" style="font-size: 12px; line-height: 1.5; color: #8c959f;">
                      Email này được gửi tự động từ hệ thống Thư viện Libri.<br>
                      Vui lòng không trả lời trực tiếp email này.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }

    /// <summary>
    /// Mẫu email xác thực đăng ký tài khoản Libri (hiệu lực OTP: 3 phút).
    /// </summary>
    public static string BuildRegistrationOtpEmail(string toEmail, string otpCode, string? fullName = null)
    {
        var safeFullName = WebUtility.HtmlEncode(!string.IsNullOrWhiteSpace(fullName) ? fullName.Trim() : "Bạn đọc");
        var safeOtp = WebUtility.HtmlEncode(otpCode.Trim());

        var bodyContent = $$"""
        <h1 style="font-size: 20px; font-weight: 600; color: {{TextColor}}; margin: 0 0 16px 0; line-height: 1.3;">Xác thực tài khoản Libri</h1>
        <p style="font-size: 14px; line-height: 1.6; color: {{TextColor}}; margin: 0 0 16px 0;">
          Xin chào <strong>{{safeFullName}}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: {{TextColor}}; margin: 0 0 20px 0;">
          Cảm ơn bạn đã đăng ký tài khoản tại <strong>Libri</strong>. Để hoàn tất đăng ký và kích hoạt tài khoản của bạn, vui lòng nhập mã xác thực (OTP) bên dưới:
        </p>

        <!-- Hộp hiển thị mã OTP nổi bật -->
        <div style="background-color: {{CanvasBackground}}; border: 1px solid {{BorderColor}}; border-radius: 6px; padding: 20px 16px; margin: 24px 0; text-align: center;">
          <div style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: {{BrandColor}}; line-height: 1.2;">
            {{safeOtp}}
          </div>
          <div style="font-size: 12px; color: {{MutedTextColor}}; margin-top: 8px;">
            (Mã có hiệu lực trong vòng 3 phút)
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: {{MutedTextColor}}; margin: 0 0 24px 0;">
          Mã xác thực này chỉ có hiệu lực trong vòng <strong>3 phút</strong>. Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
        </p>

        <div style="height: 1px; background-color: {{DividerColor}}; margin: 24px 0;"></div>

        <p style="font-size: 14px; line-height: 1.5; color: {{TextColor}}; margin: 0;">
          Trân trọng,<br>
          <strong>Đội ngũ Libri</strong>
        </p>
        """;

        return BuildBaseCard("Xác thực tài khoản Libri", bodyContent);
    }

    /// <summary>
    /// Mẫu email đặt lại mật khẩu Libri (hiệu lực OTP: 15 phút).
    /// </summary>
    public static string BuildPasswordResetEmail(string toEmail, string otpCode, string resetLink, string? fullName = null)
    {
        var safeFullName = WebUtility.HtmlEncode(!string.IsNullOrWhiteSpace(fullName) ? fullName.Trim() : "Bạn đọc");
        var safeEmail = WebUtility.HtmlEncode(toEmail.Trim());
        var safeOtp = WebUtility.HtmlEncode(otpCode.Trim());
        var safeResetLink = WebUtility.HtmlEncode(resetLink);

        var bodyContent = $$"""
        <h1 style="font-size: 20px; font-weight: 600; color: {{TextColor}}; margin: 0 0 16px 0; line-height: 1.3;">Đặt lại mật khẩu Libri</h1>
        <p style="font-size: 14px; line-height: 1.6; color: {{TextColor}}; margin: 0 0 16px 0;">
          Xin chào <strong>{{safeFullName}}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: {{TextColor}}; margin: 0 0 20px 0;">
          Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>{{safeEmail}}</strong>. Bạn có thể sử dụng mã OTP gồm 6 chữ số bên dưới:
        </p>

        <!-- Hộp hiển thị mã OTP nổi bật -->
        <div style="background-color: {{CanvasBackground}}; border: 1px solid {{BorderColor}}; border-radius: 6px; padding: 20px 16px; margin: 24px 0; text-align: center;">
          <div style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: {{BrandColor}}; line-height: 1.2;">
            {{safeOtp}}
          </div>
          <div style="font-size: 12px; color: {{MutedTextColor}}; margin-top: 8px;">
            (Mã có hiệu lực trong vòng 15 phút)
          </div>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: {{TextColor}}; margin: 0 0 16px 0;">
          Hoặc bạn có thể bấm trực tiếp vào nút bên dưới để tiến hành đặt lại mật khẩu:
        </p>

        <!-- Nút bấm đặt lại mật khẩu (Tối ưu tương thích mọi Email Client) -->
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 16px 0 20px 0;">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: {{BrandColor}};">
              <a href="{{safeResetLink}}" target="_blank" style="display: inline-block; padding: 11px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: {{BrandColor}};">
                Đặt lại mật khẩu
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 12px; line-height: 1.5; color: {{MutedTextColor}}; word-break: break-all; margin: 0 0 20px 0;">
          Nếu nút bấm trên không hoạt động, bạn có thể sao chép liên kết sau vào trình duyệt:<br>
          <a href="{{safeResetLink}}" style="color: {{BrandColor}}; text-decoration: underline;">{{safeResetLink}}</a>
        </p>

        <p style="font-size: 13px; line-height: 1.5; color: {{MutedTextColor}}; margin: 0 0 24px 0;">
          Mã xác thực và liên kết chỉ có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn an toàn.
        </p>

        <div style="height: 1px; background-color: {{DividerColor}}; margin: 24px 0;"></div>

        <p style="font-size: 14px; line-height: 1.5; color: {{TextColor}}; margin: 0;">
          Trân trọng,<br>
          <strong>Đội ngũ Libri</strong>
        </p>
        """;

        return BuildBaseCard("Đặt lại mật khẩu Libri", bodyContent);
    }
}
