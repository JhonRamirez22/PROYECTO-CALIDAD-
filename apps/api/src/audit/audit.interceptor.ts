import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AuditService } from "./audit.service";

const MODULE_MAP: Record<string, string> = {
  "/products": "products",
  "/lots": "lots",
  "/clients": "clients",
  "/orders": "orders",
  "/payments": "payments",
  "/certificates": "certificates",
  "/quality": "quality",
  "/documents": "documents",
  "/users": "users",
  "/permissions": "permissions",
  "/shipments": "shipments",
  "/customs-documents": "customs-documents",
  "/eudr-documents": "eudr-documents",
  "/farm-certificates": "farm-certificates",
  "/notifications": "notifications",
};

const ACTION_MAP: Record<string, string> = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params, ip } = request;

    // Skip GET requests and webhooks
    if (method === "GET" || url.includes("/webhook") || url.includes("/audit")) {
      return next.handle();
    }

    const module = this.resolveModule(url);
    if (!module) return next.handle();

    const action = ACTION_MAP[method] || "CREATE";
    const entityId = params?.id;
    const userPayload = user as any;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          await this.auditService.log({
            userId: userPayload?.sub,
            userName: userPayload?.email,
            action,
            module,
            entityId: entityId || responseData?.id,
            newValues: body || undefined,
            ipAddress: ip,
          });
        } catch {
          // Don't let audit failures break the request
        }
      })
    );
  }

  private resolveModule(url: string): string | null {
    for (const [path, module] of Object.entries(MODULE_MAP)) {
      if (url.startsWith(path)) return module;
    }
    return null;
  }
}
