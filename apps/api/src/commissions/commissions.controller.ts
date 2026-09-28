import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
} from "@nestjs/common";
import { CommissionsService } from "./commissions.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("commissions")
@UseGuards(AuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  @Get()
  @Roles("ADMIN")
  findAll() {
    return this.commissionsService.findAll();
  }

  @Get("seller/:sellerId")
  @Roles("ADMIN", "VENDEDOR")
  findBySeller(@Param("sellerId") sellerId: string) {
    return this.commissionsService.findBySeller(sellerId);
  }

  @Get(":id")
  @Roles("ADMIN", "VENDEDOR")
  findOne(@Param("id") id: string) {
    return this.commissionsService.findOne(id);
  }

  @Put(":id/status")
  @Roles("ADMIN")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.commissionsService.update(id, { status, paidAt: status === "PAGADA" ? new Date() : undefined });
  }
}
