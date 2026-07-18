export abstract class DomainError extends Error {
  public readonly statusCode: number;

  protected constructor(
    message: string,
    statusCode: number,
  ) {
    super(message);

    this.name = new.target.name;
    this.statusCode = statusCode;

    Error.captureStackTrace?.(
      this,
      new.target,
    );
  }
}