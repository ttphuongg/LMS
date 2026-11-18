using System.Net;

namespace Library.Modules.Core.Notifications.Features.EmailHandlers;

/// <summary>
/// Các mẫu HTML Email nhận diện thương hiệu Thư viện Libri (Màu xanh chủ đạo #003D28, chuẩn responsive).
/// </summary>
public static class EmailTemplates
{
    private static string WrapLayout(
        string title, 
        string badgeText, 
        string badgeBgColor, 
        string bodyContent, 
        string? buttonText = null, 
        string? buttonUrl = null,
        string? noteText = null)
    {
        var buttonHtml = !string.IsNullOrWhiteSpace(buttonText) && !string.IsNullOrWhiteSpace(buttonUrl)
            ? $"""
            <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="{buttonUrl}" style="display: inline-block; background-color: #003D28; color: #ffffff; text-decoration: none; padding: 13px 32px; font-size: 15px; font-weight: 600; border-radius: 6px; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(0,61,40,0.15);">
                    {WebUtility.HtmlEncode(buttonText)}
                </a>
            </div>
            """
            : "";

        var noteHtml = !string.IsNullOrWhiteSpace(noteText)
            ? $"""
            <div style="background-color: #fdfbf7; border-left: 3px solid #c5a880; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">{noteText}</p>
            </div>
            """
            : "";

        return $"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{WebUtility.HtmlEncode(title)}</title>
        </head>
        <body style="margin: 0; padding: 24px 12px; background-color: #f4efe6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2dad0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #003D28; padding: 28px 32px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-family: Georgia, serif; font-size: 26px; letter-spacing: 2px; font-weight: normal;">LIBRI</h1>
                                    <p style="margin: 6px 0 0 0; color: #d1c7b7; font-size: 13px; letter-spacing: 0.5px;">Hệ Thống Quản Lý Thư Viện Hiện Đại</p>
                                </td>
                            </tr>

                            <!-- Badge & Main Content -->
                            <tr>
                                <td style="padding: 36px 32px 28px 32px;">
                                    <div style="margin-bottom: 20px;">
                                        <span style="display: inline-block; background-color: {badgeBgColor}; color: #ffffff; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                                            {WebUtility.HtmlEncode(badgeText)}
                                        </span>
                                    </div>

                                    <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600; line-height: 1.4;">
                                        {WebUtility.HtmlEncode(title)}
                                    </h2>

                                    {bodyContent}

                                    {noteHtml}

                                    {buttonHtml}
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #faf8f5; border-top: 1px solid #f0eae1; padding: 24px 32px; text-align: center;">
                                    <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px;">
                                        Thư viện Đại học / Libri Library System
                                    </p>
                                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                        Email này được gửi tự động từ hệ thống thông báo. Vui lòng không phản hồi trực tiếp vào địa chỉ này.
                                    </p>
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
    /// Kịch bản 1: Đặt trước sách thành công
    /// </summary>
    public static string ReservationCreated(string readerName, string bookTitle, bool isReady, DateTime? expiresAt, string appUrl)
    {
        var title = isReady 
            ? "Sách đặt trước đã sẵn sàng tại quầy" 
            : "Đăng ký giữ chỗ sách thành công";

        var badgeText = isReady ? "Sẵn sàng nhận sách" : "Đã vào hàng chờ";
        var badgeColor = isReady ? "#003D28" : "#854d0e"; // Xanh đậm hoặc Vàng đất

        string body;
        string? note;

        if (isReady)
        {
            var expStr = expiresAt.HasValue ? expiresAt.Value.AddHours(7).ToString("dd/MM/yyyy HH:mm") : "trong 48 giờ tới";
            body = $"""
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Xin chào <strong>{WebUtility.HtmlEncode(readerName)}</strong>,
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Cuốn sách <strong>"{WebUtility.HtmlEncode(bookTitle)}"</strong> mà bạn vừa đặt trước hiện đã có sẵn một bản sao tại quầy tiếp đón của thư viện.
            </p>
            <div style="background-color: #f9f6f0; border: 1px solid #e5dfd5; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Tác phẩm:</strong> {WebUtility.HtmlEncode(bookTitle)}</p>
                <p style="margin: 0; font-size: 14px; color: #b45309;"><strong>Hạn chót đến nhận:</strong> {expStr} (Thời hạn 48 giờ)</p>
            </div>
            """;
            note = "Sau thời hạn 48 giờ kể từ lúc sách sẵn sàng, nếu bạn không đến nhận tại quầy, lượt giữ sách sẽ tự động bị hủy để chuyển cho bạn đọc kế tiếp.";
        }
        else
        {
            body = $"""
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Xin chào <strong>{WebUtility.HtmlEncode(readerName)}</strong>,
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Bạn đã đăng ký giữ chỗ thành công cho tác phẩm <strong>"{WebUtility.HtmlEncode(bookTitle)}"</strong>.
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Hiện tại tất cả các bản sao của cuốn sách này đang được mượn bởi các bạn đọc khác. Hệ thống đã đưa bạn vào hàng đợi ưu tiên.
            </p>
            """;
            note = "Ngay khi có độc giả hoàn trả bản sao về thư viện, hệ thống sẽ tự động gán sách và gửi email thông báo kèm thời hạn nhận sách cho bạn.";
        }

        return WrapLayout(title, badgeText, badgeColor, body, "Quản lý phiếu đặt trước", $"{appUrl.TrimEnd('/')}/my-loans", note);
    }

    /// <summary>
    /// Kịch bản 2: Tài khoản bị khóa
    /// </summary>
    public static string AccountLocked(string readerName, string reason, DateTime lockedAt, string appUrl)
    {
        var title = "Thông báo tạm khóa tài khoản độc giả";
        var badgeText = "Tài khoản bị khóa";
        var badgeColor = "#991b1b"; // Đỏ đậm

        var timeStr = lockedAt.AddHours(7).ToString("dd/MM/yyyy HH:mm");
        var body = $"""
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Kính gửi <strong>{WebUtility.HtmlEncode(readerName)}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Hệ thống quản lý thư viện xin thông báo: Tài khoản độc giả của bạn đã bị <strong>tạm khóa</strong> vào lúc <strong>{timeStr}</strong>.
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #991b1b;">
                <strong>Lý do tạm khóa:</strong> {WebUtility.HtmlEncode(reason)}
            </p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Trong thời gian bị khóa, các quyền mượn sách mới, gia hạn sách và đặt trước sách của bạn sẽ tạm thời bị ngưng kích hoạt.
        </p>
        """;

        var note = "Nếu bạn cần giải đáp thắc mắc hoặc xử lý các nghĩa vụ quá hạn / bồi hoàn để mở lại tài khoản, vui lòng liên hệ trực tiếp quầy thủ thư hoặc gửi email hỗ trợ.";

        return WrapLayout(title, badgeText, badgeColor, body, "Xem thông tin tài khoản", $"{appUrl.TrimEnd('/')}/profile", note);
    }

    /// <summary>
    /// Kịch bản 3: Sắp tới hạn trả sách 3 - 5 ngày
    /// </summary>
    public static string LoanDueSoon(string readerName, string bookTitle, DateOnly dueDate, int daysUntilDue, string appUrl)
    {
        var title = $"Nhắc nhở: Sách sắp đến hạn trả trong {daysUntilDue} ngày tới";
        var badgeText = $"Còn {daysUntilDue} ngày";
        var badgeColor = "#b45309"; // Cam đất

        var body = $"""
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Xin chào <strong>{WebUtility.HtmlEncode(readerName)}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Thư viện xin gửi email nhắc nhở về cuốn sách bạn đang mượn sắp đến thời hạn hoàn trả theo quy định:
        </p>
        <div style="background-color: #fdf6ec; border: 1px solid #f9dfb5; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Tên sách:</strong> {WebUtility.HtmlEncode(bookTitle)}</p>
            <p style="margin: 0; font-size: 14px; color: #b45309;"><strong>Ngày hạn trả:</strong> {dueDate:dd/MM/yyyy} (Còn {daysUntilDue} ngày)</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Nếu bạn vẫn còn nhu cầu tiếp tục đọc, bạn có thể thực hiện <strong>Gia hạn sách trực tuyến</strong> ngay trên website nếu cuốn sách chưa có người khác đặt trước.
        </p>
        """;

        var note = "Xin lưu ý hoàn trả sách đúng thời hạn để tránh phát sinh chi phí phạt quá hạn (5.000 VNĐ / ngày trễ) và đảm bảo quyền lợi mượn sách cho các bạn đọc khác.";

        return WrapLayout(title, badgeText, badgeColor, body, "Gia hạn sách ngay", $"{appUrl.TrimEnd('/')}/my-loans", note);
    }

    /// <summary>
    /// Kịch bản 4: Sách đã quá hạn trả
    /// </summary>
    public static string LoanOverdue(string readerName, string bookTitle, DateOnly dueDate, int daysOverdue, decimal fineAmount, string appUrl)
    {
        var title = "Cảnh báo: Sách mượn đã quá hạn trả";
        var badgeText = "Đã quá hạn";
        var badgeColor = "#991b1b"; // Đỏ cảnh báo

        var fineStr = fineAmount.ToString("N0") + " VNĐ";
        var body = $"""
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Xin chào <strong>{WebUtility.HtmlEncode(readerName)}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Hệ thống ghi nhận cuốn sách bạn đang mượn hiện <strong>đã quá hạn trả</strong>:
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Tên sách:</strong> {WebUtility.HtmlEncode(bookTitle)}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Ngày đến hạn:</strong> {dueDate:dd/MM/yyyy}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;"><strong>Số ngày trễ hạn:</strong> {daysOverdue} ngày</p>
            <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Mức phạt tạm tính (5.000đ/ngày):</strong> {fineStr}</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Vui lòng mang sách đến quầy tiếp đón của thư viện để hoàn trả trong thời gian sớm nhất, tránh làm gia tăng chi phí phạt và ảnh hưởng đến quyền mượn sách của tài khoản.
        </p>
        """;

        var note = "Nếu bạn đã hoàn trả sách trong ngày hôm nay nhưng vẫn nhận được email này, xin vui lòng kiểm tra lại trạng thái trên website hoặc liên hệ thủ thư để được xác nhận.";

        return WrapLayout(title, badgeText, badgeColor, body, "Kiểm tra khoản phạt & sách", $"{appUrl.TrimEnd('/')}/my-loans", note);
    }
}

