using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.Extensions.Caching.Memory;
using Library.Modules.Core.Billing.Data;
using Library.Modules.Core.Catalog.Data;
using Library.Modules.Core.Circulation.Data;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Notifications.Data;
using Library.Modules.Core.Search.Data;
using Library.Modules.Core.Shared.Persistence;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Identity.Features.Register;
using Library.Modules.Core.Identity.Features.Login;
using Library.Modules.Core.Identity.Features.UpdateProfile;
using Library.Modules.Core.Catalog.Features.AddBook;
using Library.Modules.Core.Catalog.Features.SearchBook;
using Library.Modules.Core.Catalog.Features.ManageCopies;
using Library.Modules.Core.Circulation.Features.BorrowBook;
using Library.Modules.Core.Circulation.Features.ReturnBook;
using Library.Modules.Core.Circulation.Features.ReserveBook;
using Library.Modules.Core.Circulation.Features.RequestRenewal;
using Library.Modules.Core.Billing.Features.IssueFine;
using Library.Modules.Core.Billing.Features.PayFine;
using Library.Modules.Core.Notifications.Features.MarkAsRead;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

builder.Services.AddSharedPersistence(connectionString);
builder.Services.AddModuleDbContext<IdentityDbContext>();
builder.Services.AddModuleDbContext<CatalogDbContext>();
builder.Services.AddModuleDbContext<CirculationDbContext>();
builder.Services.AddModuleDbContext<BillingDbContext>();
builder.Services.AddModuleDbContext<NotificationsDbContext>();
builder.Services.AddModuleDbContext<SearchDbContext>();

// ── MediatR — scan toàn bộ assembly của Library.Modules.Core ──────────────────
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(UnitOfWork).Assembly);
    cfg.AddOpenBehavior(typeof(TransactionBehavior<,>));
});

// ── FluentValidation — auto-register tất cả validators từ Core assembly ───────
builder.Services.AddValidatorsFromAssembly(typeof(UnitOfWork).Assembly);

// ── Identity Services ─────────────────────────────────────────────────────────
builder.Services.AddSingleton<JwtTokenService>();
// ── Notifications / Email Services ──────────────────────────────────────────
builder.Services.AddScoped<Library.Modules.Core.Notifications.Services.IEmailService, Library.Modules.Core.Notifications.Services.EmailService>();
builder.Services.AddScoped<Library.Modules.Core.Catalog.Services.IStorageService, Library.Modules.Core.Catalog.Services.CloudflareR2StorageService>();

// ── JSON Options: global enum string converter + camelCase ────────────────────
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");

if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Trim().Length < 32)
{
    throw new InvalidOperationException(
        "JWT Secret must contain at least 32 characters.");
}

builder.Services.AddMemoryCache();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var userIdStr = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? context.Principal?.FindFirst("sub")?.Value;

            if (int.TryParse(userIdStr, out var accountId))
            {
                var cache = context.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
                var cacheKey = $"account_locked_{accountId}";

                if (!cache.TryGetValue(cacheKey, out bool isLocked))
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<IdentityDbContext>();
                    var status = await db.Accounts
                        .AsNoTracking()
                        .Where(a => a.Id == accountId)
                        .Select(a => a.Status)
                        .FirstOrDefaultAsync();

                    isLocked = status == AccountStatus.Locked || status == AccountStatus.Inactive;
                    cache.Set(cacheKey, isLocked, TimeSpan.FromSeconds(30));
                }

                if (isLocked)
                {
                    context.Fail("Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.");
                }
            }
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOnly", policy => policy.RequireRole("Librarian", "Admin"));
    options.AddPolicy("LibrarianOnly", policy => policy.RequireRole("Librarian", "Admin"));
});

// ── API infra & Swagger với Bearer Auth ───────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Library Management API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token vào đây (không cần tiền tố 'Bearer ')."
    });
    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins != null && allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

// ── Background Jobs ───────────────────────────────────────────────────────────
if (!builder.Environment.IsEnvironment("RateLimitTest"))
{
    builder.Services.AddHostedService<Library.Web.BackgroundJobs.OverdueCheckWorker>();
    builder.Services.AddHostedService<Library.Web.BackgroundJobs.ReservationExpiryWorker>();
}

builder.Services.AddHealthChecks();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    options.ForwardLimit = 1;
    var trustedProxyIp = builder.Configuration["RateLimiting:TrustedProxyIp"]
        ?? "172.18.0.1";

    options.KnownProxies.Add(IPAddress.Parse(trustedProxyIp));
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var path = context.Request.Path;
        var method = context.Request.Method;

        if (HttpMethods.IsOptions(method) ||
            path.StartsWithSegments("/health"))
        {
            return RateLimitPartition.GetNoLimiter("excluded");
        }

        if (!path.StartsWithSegments("/api"))
        {
            return RateLimitPartition.GetNoLimiter("non-api");
        }

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var authStrict = HttpMethods.IsPost(method) &&
            (path.Equals("/api/identity/login", StringComparison.OrdinalIgnoreCase) ||
             path.Equals("/api/identity/register", StringComparison.OrdinalIgnoreCase) ||
             path.Equals("/api/identity/forgot-password", StringComparison.OrdinalIgnoreCase) ||
             path.Equals("/api/identity/reset-password", StringComparison.OrdinalIgnoreCase));

        var policy = authStrict ? "AuthStrictPolicy" : "GeneralPolicy";

        return RateLimitPartition.GetFixedWindowLimiter(
            $"{policy}:{ip}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = authStrict ? 5 : 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });

    options.OnRejected = (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
        }

        return ValueTask.CompletedTask;
    };
});

var app = builder.Build();

// ── Auto-migrate + Admin Seeder + Book Seeder ─────────────────────────────────
if (!app.Environment.IsEnvironment("RateLimitTest"))
{
using (var scope = app.Services.CreateScope())
{
    var identityDb = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    var catalogDb = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    var circulationDb = scope.ServiceProvider.GetRequiredService<CirculationDbContext>();
    var billingDb = scope.ServiceProvider.GetRequiredService<BillingDbContext>();
    var notificationsDb = scope.ServiceProvider.GetRequiredService<NotificationsDbContext>();
    var searchDb = scope.ServiceProvider.GetRequiredService<SearchDbContext>();

    try
    {
        identityDb.Database.Migrate();
        catalogDb.Database.Migrate();
        circulationDb.Database.Migrate();
        billingDb.Database.Migrate();
        notificationsDb.Database.Migrate();
        searchDb.Database.Migrate();
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical(
            ex,
            "Database migration failed. Application startup aborted.");

        throw;
    }

    var sender = scope.ServiceProvider.GetRequiredService<ISender>();
    await sender.Send(new Library.Modules.Core.Identity.Contracts.SeedDefaultAdminCommand());

    // Seed sách từ books_seed.json nếu Catalog DB chưa có sách nào
    if (!catalogDb.Books.Any())
    {
        string? seedPath = null;
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Catalog", "Data", "books_seed.json"),
            Path.Combine(AppContext.BaseDirectory, "books_seed.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "books_seed.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Library.Modules.Core", "Catalog", "Data", "books_seed.json")
        };

        foreach (var c in candidates)
        {
            if (File.Exists(c))
            {
                seedPath = c;
                break;
            }
        }

        if (seedPath != null && File.Exists(seedPath))
        {
            var jsonText = File.ReadAllText(seedPath);
            var seedItems = JsonSerializer.Deserialize<List<BookSeedDto>>(jsonText,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (seedItems != null && seedItems.Count > 0)
            {
                var authorDict = catalogDb.Authors.ToDictionary(a => a.Name, a => a, StringComparer.OrdinalIgnoreCase);
                var categoryDict = catalogDb.Categories.ToDictionary(c => c.Name, c => c, StringComparer.OrdinalIgnoreCase);

                foreach (var item in seedItems)
                {
                    if (!authorDict.TryGetValue(item.Author, out var author))
                    {
                        author = new Author { Name = item.Author };
                        catalogDb.Authors.Add(author);
                        authorDict[item.Author] = author;
                    }

                    if (!categoryDict.TryGetValue(item.Category, out var category))
                    {
                        category = new Category { Name = item.Category };
                        catalogDb.Categories.Add(category);
                        categoryDict[item.Category] = category;
                    }

                    var book = new Book
                    {
                        Title = item.Title,
                        Isbn = item.Isbn,
                        Description = item.Description,
                        PublishedYear = item.PublishedYear.HasValue ? (short)item.PublishedYear.Value : null,
                        Publisher = item.Publisher,
                        Language = item.Language,
                        PageCount = item.PageCount,
                        BookValue = item.BookValue,
                        CoverImageUrl = item.CoverImageUrl,
                        Status = BookStatus.Active
                    };
                    book.BookAuthors.Add(new BookAuthor { Author = author });
                    book.BookCategories.Add(new BookCategory { Category = category });

                    if (item.Copies != null)
                    {
                        foreach (var copy in item.Copies)
                            book.Copies.Add(new BookCopy { Barcode = copy.Barcode, Status = CopyStatus.Available });
                    }

                    catalogDb.Books.Add(book);
                }

                catalogDb.SaveChanges();
                Console.WriteLine($"[Seed] Books seeded: {seedItems.Count} books.");
            }
        }
        else
        {
            Console.WriteLine("[Seed] books_seed.json not found, skipping book seed.");
        }
    }
}
}

// Bật Swagger ở mọi môi trường để có thể test khi chạy Docker
app.UseForwardedHeaders();
app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<Library.Web.Middleware.GlobalExceptionMiddleware>();
app.UseRouting();
app.UseCors();
app.UseRateLimiter();
app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// ── Identity ──────────────────────────────────────────────────────────────────
RegisterEndpoint.Map(app);
Library.Modules.Core.Identity.Features.VerifyEmailOtp.VerifyEmailOtpEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ResendEmailOtp.ResendEmailOtpEndpoint.Map(app);
LoginEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ForgotPassword.ForgotPasswordEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ResetPassword.ResetPasswordEndpoint.Map(app);
UpdateProfileEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ManageUsers.ManageUsersEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ChangePassword.ChangePasswordEndpoint.Map(app);
Library.Modules.Core.Identity.Features.RefreshToken.RefreshTokenEndpoint.Map(app);
Library.Modules.Core.Identity.Features.Logout.LogoutEndpoint.Map(app);
Library.Modules.Core.Identity.Features.GetMyProfile.GetMyProfileEndpoint.Map(app);

// ── Catalog ───────────────────────────────────────────────────────────────────
AddBookEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.UpdateBook.UpdateBookEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.UpdateBookStatus.UpdateBookStatusEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.GetBookDetails.GetBookDetailsEndpoint.Map(app);
SearchBookEndpoint.Map(app);
ManageCopiesEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageAuthors.ManageAuthorsEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageCategories.ManageCategoriesEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageLocations.ManageLocationsEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.UploadBookCover.UploadBookCoverEndpoint.Map(app);

// ── Circulation ───────────────────────────────────────────────────────────────
BorrowBookEndpoint.Map(app);
ReturnBookEndpoint.Map(app);
ReserveBookEndpoint.Map(app);
RequestRenewalEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.ApproveRenewal.ApproveRenewalEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetMyLoans.GetMyLoansEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.CancelReservation.CancelReservationEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.ReportIncident.ReportIncidentEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetAllLoans.GetAllLoansEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetAllReservations.GetAllReservationsEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetLoanDetail.GetLoanDetailEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetAllRenewals.GetAllRenewalsEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetMyReservations.GetMyReservationsEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetCirculationEligibility.GetCirculationEligibilityEndpoint.Map(app);

// ── Billing ───────────────────────────────────────────────────────────────────
IssueFineEndpoint.Map(app);
PayFineEndpoint.Map(app);
Library.Modules.Core.Billing.Features.GetMyFines.GetMyFinesEndpoint.Map(app);
Library.Modules.Core.Billing.Features.GetAllFines.GetAllFinesEndpoint.Map(app);

// ── Notifications, Search & Dashboard ─────────────────────────────────────────
MarkAsReadEndpoint.Map(app);
Library.Modules.Core.Notifications.Features.GetMyNotifications.GetMyNotificationsEndpoint.Map(app);
Library.Modules.Core.Search.Features.GetMySearchHistory.GetMySearchHistoryEndpoint.Map(app);
Library.Modules.Core.Dashboard.Features.GetDashboardStats.GetDashboardStatsEndpoint.Map(app);

app.MapHealthChecks("/health").AllowAnonymous();

app.Run();

// ── Seed DTOs ─────────────────────────────────────────────────────────────────
internal record BookSeedDto(
    string Title,
    string Author,
    string Category,
    string? Isbn,
    string? Description,
    int? PublishedYear,
    string? Publisher,
    string? Language,
    int? PageCount,
    decimal? BookValue,
    string? CoverImageUrl,
    List<CopySeedDto>? Copies
);
internal record CopySeedDto(string Barcode);
