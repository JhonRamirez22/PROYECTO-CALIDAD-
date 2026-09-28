import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("summary")
  getSummary(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.dashboardService.getSummary({ startDate, endDate });
  }

  @Get("orders-by-status")
  getOrdersByStatus(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.dashboardService.getOrdersByStatus({ startDate, endDate });
  }

  @Get("orders-recent")
  getOrdersRecent(@Query("limit") limit?: string) {
    return this.dashboardService.getOrdersRecent(limit ? parseInt(limit) : 10);
  }

  @Get("sales-by-product")
  getSalesByProduct(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.dashboardService.getSalesByProduct({ startDate, endDate });
  }

  @Get("sales-monthly")
  getSalesMonthly() {
    return this.dashboardService.getSalesMonthly();
  }

  @Get("quality-summary")
  getQualitySummary() {
    return this.dashboardService.getQualitySummary();
  }

  @Get("top-clients")
  getTopClients(@Query("limit") limit?: string) {
    return this.dashboardService.getTopClients(limit ? parseInt(limit) : 5);
  }

  @Get("top-products")
  getTopProducts(@Query("limit") limit?: string) {
    return this.dashboardService.getTopProducts(limit ? parseInt(limit) : 5);
  }

  @Get("trends")
  getTrends() {
    return this.dashboardService.getTrends();
  }
}
