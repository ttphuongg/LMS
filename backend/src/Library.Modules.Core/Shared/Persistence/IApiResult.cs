namespace Library.Modules.Core.Shared.Persistence;

/// <summary>
/// Common interface for operation results to determine whether an ambient transaction
/// should commit or roll back.
/// </summary>
public interface IApiResult
{
    bool Success { get; }
}

