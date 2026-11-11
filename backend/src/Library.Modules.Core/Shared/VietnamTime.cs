namespace Library.Modules.Core.Shared;

/// <summary>
/// Chuẩn hóa mốc thời gian UTC và ngày lịch Việt Nam (UTC+7) dùng chung giữa các module.
/// </summary>
public static class VietnamTime
{
    public const int OffsetHours = 7;

    /// <summary>Ngày hiện tại theo múi giờ Việt Nam (UTC+7).</summary>
    public static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(OffsetHours));

    /// <summary>Quy đổi một ngày lịch Việt Nam sang khoảng thời gian UTC [StartUtc, EndUtc).</summary>
    public static (DateTime StartUtc, DateTime EndUtc) GetUtcDayRange(DateOnly vnDate)
    {
        var startUtc = vnDate.ToDateTime(TimeOnly.MinValue).AddHours(-OffsetHours);
        return (startUtc, startUtc.AddDays(1));
    }

    /// <summary>Đánh dấu DateTime đọc từ SQL datetime2 (lưu bằng UtcNow) là DateTimeKind.Utc mà không dịch giờ.</summary>
    public static DateTime SpecifyUtc(DateTime utcDateTime) =>
        utcDateTime.Kind == DateTimeKind.Utc
            ? utcDateTime
            : DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
}

