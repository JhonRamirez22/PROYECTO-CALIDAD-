import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../auth/decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("No autenticado");
    }

    const userRoles: string[] = user.roles || (user.role ? [user.role] : []);
    const hasRole = userRoles.some((r: string) => requiredRoles.includes(r));

    if (!hasRole) {
      throw new ForbiddenException(
        `No tienes permiso. Roles requeridos: ${requiredRoles.join(", ")}`
      );
    }

    return true;
  }
}
