namespace Library.Modules.Core.Identity.Features.Register;

public record RegisterResponse(
    int AccountId,
    string Email,
    string Message
);
