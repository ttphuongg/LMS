namespace Library.Modules.Core.Shared.Persistence;

/// <summary>
/// Marker interface for commands that perform writes across two or more modules,
/// triggering atomic transaction management via TransactionBehavior.
/// </summary>
public interface ITransactionalCommand { }

