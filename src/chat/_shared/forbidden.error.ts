import { DomainError } from "./domain-error.js";

export class ForbiddenError extends DomainError {
  constructor(
    message = "You do not have permission to perform this action.",
  ) {
    super(message, 403);
  }
}