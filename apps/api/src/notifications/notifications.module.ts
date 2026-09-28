import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { CertificateExpiryService } from "./certificate-expiry.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, CertificateExpiryService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
