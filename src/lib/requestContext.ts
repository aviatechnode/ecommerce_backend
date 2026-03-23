import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  userId?: string | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = () => requestContext.getStore();