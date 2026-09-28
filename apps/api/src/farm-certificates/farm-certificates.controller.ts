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
import { FarmCertificatesService } from "./farm-certificates.service";
import { CreateFarmCertificateDto, UpdateFarmCertificateDto } from "./dto/farm-certificate.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("farm-certificates")
@UseGuards(AuthGuard, RolesGuard)
export class FarmCertificatesController {
  constructor(private farmCertificatesService: FarmCertificatesService) {}

  @Post()
  @Roles("ADMIN", "PROPIETARIO")
  create(@Body() dto: CreateFarmCertificateDto) {
    return this.farmCertificatesService.create(dto);
  }

  @Get()
  @Roles("ADMIN", "PROPIETARIO")
  findAll() {
    return this.farmCertificatesService.findAll();
  }

  @Get("seller-profile/:sellerProfileId")
  findBySellerProfile(@Param("sellerProfileId") sellerProfileId: string) {
    return this.farmCertificatesService.findBySellerProfile(sellerProfileId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.farmCertificatesService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "PROPIETARIO")
  update(@Param("id") id: string, @Body() dto: UpdateFarmCertificateDto) {
    return this.farmCertificatesService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.farmCertificatesService.remove(id);
  }
}
