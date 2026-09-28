import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("audit")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(
    @Query("userId") userId?: string,
    @Query("module") module?: string,
    @Query("action") action?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.auditService.findAll({
      userId,
      module,
      action,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get("stats")
  getStats() {
    return this.auditService.getStats();
  }
}
