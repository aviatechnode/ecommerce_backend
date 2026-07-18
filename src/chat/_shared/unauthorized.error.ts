import { DomainError } from "./domain-error.js";

export class UnauthorizedError extends DomainError {
  constructor(
    message = "Authentication required.",
  ) {
    super(message, 401);
  }
}