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
} from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { CreateClientDto, CreateContactDto, ClientFilterDto, UpdateContactDto, CreateClientContractDto } from "./dto/client.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("clients")
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: ClientFilterDto) {
    return this.clientsService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @Post(":id/contacts")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  addContact(@Param("id") id: string, @Body() dto: CreateContactDto) {
    return this.clientsService.addContact(id, dto);
  }

  @Post(":id/contracts")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  createContract(@Param("id") id: string, @Body() dto: CreateClientContractDto) {
    return this.clientsService.createContract(id, dto);
  }

  @Put("contacts/:contactId")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  updateContact(@Param("contactId") contactId: string, @Body() dto: UpdateContactDto) {
    return this.clientsService.updateContact(contactId, dto);
  }

  @Delete("contacts/:contactId")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  removeContact(@Param("contactId") contactId: string) {
    return this.clientsService.removeContact(contactId);
  }

  @Get(":id/purchase-history")
  getPurchaseHistory(@Param("id") id: string) {
    return this.clientsService.getPurchaseHistory(id);
  }
}
