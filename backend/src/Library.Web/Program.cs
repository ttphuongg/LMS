using System.Text;
using BCrypt.Net;
using FluentValidation;
using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Identity.Services;
using Library.Modules.Core.Shared;
using Library.Modules.Core.Identity.Features.Register;
using Library.Modules.Core.Identity.Features.Login;
using Library.Modules.Core.Identity.Features.UpdateProfile;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ── MediatR — scan toàn bộ assembly của Library.Modules.Core ──────────────────
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(AppDbContext).Assembly));

// ── FluentValidation — auto-register tất cả validators từ Core assembly ───────
builder.Services.AddValidatorsFromAssembly(typeof(AppDbContext).Assembly);

// ── Identity Services ─────────────────────────────────────────────────────────
builder.Services.AddSingleton<JwtTokenService>();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");

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
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOnly", policy => policy.RequireRole("Librarian", "Admin"));
    options.AddPolicy("LibrarianOnly", policy => policy.RequireRole("Librarian", "Admin"));
});

// ── API infra ─────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── CORS — cho phép Frontend gọi API ─────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ── Background Jobs ───────────────────────────────────────────────────────────
builder.Services.AddHostedService<Library.Web.BackgroundJobs.OverdueCheckWorker>();

var app = builder.Build();

// ── Auto-migrate + Admin Seeder ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Tạo tài khoản Admin mặc định nếu chưa có Admin nào trong DB
    if (!db.Accounts.Any(a => a.Role == AccountRole.Admin))
    {
        var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var adminUsername = cfg["AdminSeed:Username"] ?? "admin";
        var adminPassword = cfg["AdminSeed:Password"] ?? "Admin@123456";
        var adminEmail = cfg["AdminSeed:Email"] ?? "admin@library.vn";
        var adminFullName = cfg["AdminSeed:FullName"] ?? "System Administrator";

        db.Accounts.Add(new Account
        {
            Username = adminUsername.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            FullName = adminFullName,
            Email = adminEmail.Trim().ToLowerInvariant(),
            Role = AccountRole.Admin,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();

        Console.WriteLine($"[Seed] Admin account created: username='{adminUsername}'");
    }
}

// Bật Swagger ở mọi môi trường để có thể test khi chạy Docker
app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<Library.Web.Middleware.GlobalExceptionMiddleware>();
app.UseCors();

if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

// ── Identity Endpoints ────────────────────────────────────────────────────────
RegisterEndpoint.Map(app);
LoginEndpoint.Map(app);
UpdateProfileEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ManageUsers.ManageUsersEndpoint.Map(app);
Library.Modules.Core.Identity.Features.ChangePassword.ChangePasswordEndpoint.Map(app);
Library.Modules.Core.Identity.Features.RefreshToken.RefreshTokenEndpoint.Map(app);
Library.Modules.Core.Identity.Features.Logout.LogoutEndpoint.Map(app);
Library.Modules.Core.Identity.Features.GetMyProfile.GetMyProfileEndpoint.Map(app);

// ── Catalog Endpoints ─────────────────────────────────────────────────────────
Library.Modules.Core.Catalog.Features.AddBook.AddBookEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.GetBookDetails.GetBookDetailsEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageAuthors.ManageAuthorsEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageCategories.ManageCategoriesEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageCopies.ManageCopiesEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.ManageLocations.ManageLocationsEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.SearchBook.SearchBookEndpoint.Map(app);
Library.Modules.Core.Catalog.Features.UpdateBook.UpdateBookEndpoint.Map(app);

// ── Circulation ───────────────────────────────────────────────────────────────
Library.Modules.Core.Circulation.Features.BorrowBook.BorrowBookEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.ReturnBook.ReturnBookEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.ReserveBook.ReserveBookEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.RequestRenewal.RequestRenewalEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.ApproveRenewal.ApproveRenewalEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetMyLoans.GetMyLoansEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.CancelReservation.CancelReservationEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.ReportIncident.ReportIncidentEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetAllLoans.GetAllLoansEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetAllReservations.GetAllReservationsEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetLoanDetail.GetLoanDetailEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetAllRenewals.GetAllRenewalsEndpoint.Map(app);
Library.Modules.Core.Circulation.Features.GetMyReservations.GetMyReservationsEndpoint.Map(app);

app.Run();
