import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("cart")
@UseGuards(AuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Post()
  addItem(@Body() dto: AddCartItemDto) {
    return this.cartService.addItem(dto);
  }

  @Get(":sessionId")
  getCart(@Param("sessionId") sessionId: string) {
    return this.cartService.getCart(sessionId);
  }

  @Put(":id/quantity")
  updateQuantity(@Param("id") id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateQuantity(id, dto.quantity);
  }

  @Delete(":id")
  removeItem(@Param("id") id: string) {
    return this.cartService.removeItem(id);
  }

  @Delete("session/:sessionId")
  clearCart(@Param("sessionId") sessionId: string) {
    return this.cartService.clearCart(sessionId);
  }
}
