using Library.Modules.Core.Identity.Data;
using Library.Modules.Core.Shared;
using MediatR;

namespace Library.Modules.Core.Identity.Features.ManageUsers;

public record GetUsersRequest(string? Keyword, int? Role, int Page = 1, int PageSize = 10) : IRequest<ApiResponse<GetUsersResult>>;
public record GetUsersResult(List<UserSummary> Items, int TotalCount);
public record UserSummary(int Id, string Username, string FullName, string Email, string Role, string Status);

public record ChangeRoleRequest(int AccountId, AccountRole NewRole) : IRequest<ApiResponse<bool>>;
public record ChangeStatusRequest(int AccountId, AccountStatus NewStatus) : IRequest<ApiResponse<bool>>;
