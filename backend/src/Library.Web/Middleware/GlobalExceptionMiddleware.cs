using System.Net;
using System.Text.Json;
using Library.Modules.Core.Shared;

namespace Library.Web.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt.");
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail(ex.Message);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred.");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail("Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau hoặc liên hệ quản trị viên.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
    }
}
