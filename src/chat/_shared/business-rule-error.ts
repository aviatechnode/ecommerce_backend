import { DomainError } from "./domain-error.js";

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}