import { DomainError } from "./domain-error.js";

export class NotFoundError extends DomainError {
  constructor(
    message = "Resource not found.",
  ) {
    super(message, 404);
  }
}