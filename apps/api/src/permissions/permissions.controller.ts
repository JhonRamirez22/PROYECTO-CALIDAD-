import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("permissions")
@UseGuards(AuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get("matrix")
  @Roles("ADMIN")
  getMatrix() {
    return this.permissionsService.getMatrix();
  }

  @Get("role/:role")
  findByRole(@Param("role") role: string) {
    return this.permissionsService.findByRole(role);
  }

  @Put(":role/:module")
  @Roles("ADMIN")
  updatePermission(
    @Param("role") role: string,
    @Param("module") module: string,
    @Body() body: { canCreate?: boolean; canRead?: boolean; canUpdate?: boolean; canDelete?: boolean }
  ) {
    return this.permissionsService.updatePermission(role, module, body);
  }
}
