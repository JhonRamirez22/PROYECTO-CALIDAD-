import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  RawBodyRequest,
  HttpCode,
  Headers,
  UseGuards,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreateCheckoutSessionDto } from "./dto/payment.dto";
import { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("payments")
@UseGuards(AuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post("create-checkout-session")
  @Roles("ADMIN")
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.paymentsService.createCheckoutSession(
      dto.orderId,
      dto.successUrl,
      dto.cancelUrl
    );
  }

  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ) {
    return this.paymentsService.handleWebhook(
      req.rawBody!,
      signature
    );
  }

  @Get("status/:orderId")
  getPaymentStatus(@Param("orderId") orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }
}
