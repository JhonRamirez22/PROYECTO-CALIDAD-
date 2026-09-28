import { Module, OnModuleInit } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { LotsModule } from "./lots/lots.module";
import { ClientsModule } from "./clients/clients.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { PermissionsService } from "./permissions/permissions.service";
import { CertificatesModule } from "./certificates/certificates.module";
import { QualityModule } from "./quality/quality.module";
import { AuditModule } from "./audit/audit.module";
import { AuditInterceptor } from "./audit/audit.interceptor";
import { SellerProfilesModule } from "./seller-profiles/seller-profiles.module";
import { FarmCertificatesModule } from "./farm-certificates/farm-certificates.module";
import { CommissionsModule } from "./commissions/commissions.module";
import { LogisticsModule } from "./logistics/logistics.module";
import { QualitySampleModule } from "./quality-sample/quality-sample.module";
import { UsersModule } from "./users/users.module";
import { CartModule } from "./cart/cart.module";
import { DocumentsModule } from "./documents/documents.module";
import { LogisticsProvidersModule } from "./logistics-providers/logistics-providers.module";
import { ShippingDestinationsModule } from "./shipping-destinations/shipping-destinations.module";
import { ShipmentsModule } from "./shipments/shipments.module";
import { BookingsModule } from "./bookings/bookings.module";
import { CustomsDocumentsModule } from "./customs-documents/customs-documents.module";
import { EUDRDocumentsModule } from "./eudr-documents/eudr-documents.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { EmailModule } from "./email/email.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    LotsModule,
    ClientsModule,
    OrdersModule,
    PaymentsModule,
    CertificatesModule,
    QualityModule,
    PermissionsModule,
    AuditModule,
    SellerProfilesModule,
    FarmCertificatesModule,
    CommissionsModule,
    LogisticsModule,
    QualitySampleModule,
    UsersModule,
    CartModule,
    DocumentsModule,
    LogisticsProvidersModule,
    ShippingDestinationsModule,
    ShipmentsModule,
    BookingsModule,
    CustomsDocumentsModule,
    EUDRDocumentsModule,
    DashboardModule,
    NotificationsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private permissionsService: PermissionsService) {}

  async onModuleInit() {
    await this.permissionsService.seed();
  }
}
