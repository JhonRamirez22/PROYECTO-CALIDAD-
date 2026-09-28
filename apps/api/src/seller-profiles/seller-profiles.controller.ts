import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { SellerProfilesService } from "./seller-profiles.service";
import { CreateSellerProfileDto, UpdateSellerProfileDto } from "./dto/seller-profile.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("seller-profiles")
@UseGuards(AuthGuard, RolesGuard)
export class SellerProfilesController {
  constructor(private sellerProfilesService: SellerProfilesService) {}

  @Post()
  @Roles("ADMIN", "VENDEDOR")
  create(@Body() dto: CreateSellerProfileDto) {
    return this.sellerProfilesService.create(dto);
  }

  @Get()
  @Roles("ADMIN")
  findAll() {
    return this.sellerProfilesService.findAll();
  }

  @Get("user/:userId")
  findByUser(@Param("userId") userId: string) {
    return this.sellerProfilesService.findByUser(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sellerProfilesService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "VENDEDOR")
  update(@Param("id") id: string, @Body() dto: UpdateSellerProfileDto) {
    return this.sellerProfilesService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.sellerProfilesService.remove(id);
  }
}
