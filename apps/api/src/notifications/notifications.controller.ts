import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query("type") type?: string,
    @Query("read") read?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const userId = req.user?.sub;
    return this.notificationsService.findAll(userId, {
      type: type as any,
      read: read !== undefined ? read === "true" : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get("unread-count")
  getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user?.sub);
  }

  @Put(":id/read")
  markAsRead(@Param("id") id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user?.sub);
  }

  @Put("read-all")
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user?.sub);
  }

  @Get("preferences")
  getPreferences(@Request() req: any) {
    return this.notificationsService.getPreferences(req.user?.sub);
  }

  @Put("preferences")
  upsertPreferences(@Request() req: any, @Body() body: any) {
    return this.notificationsService.upsertPreferences(req.user?.sub, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: any) {
    return this.notificationsService.remove(id, req.user?.sub);
  }
}
