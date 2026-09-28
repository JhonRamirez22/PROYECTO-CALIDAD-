import { AuditService } from "./audit.service";

describe("AuditService", () => {
  let service: AuditService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    service = new AuditService(mockPrisma);
  });

  describe("log", () => {
    it("should create an audit log entry", async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: "log-1" });

      const result = await service.log({
        userId: "user-1",
        userName: "admin@test.com",
        action: "CREATE",
        module: "products",
        entityId: "prod-1",
        ipAddress: "127.0.0.1",
      });

      expect(result.id).toBe("log-1");
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          action: "CREATE",
          module: "products",
          entityId: "prod-1",
        }),
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated results", async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([{ id: "log-1" }]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it("should apply filters", async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ module: "orders", action: "DELETE" });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ module: "orders", action: "DELETE" }),
        })
      );
    });
  });

  describe("getStats", () => {
    it("should return aggregated stats", async () => {
      mockPrisma.auditLog.count
        .mockResolvedValueOnce(5)  // today
        .mockResolvedValueOnce(20); // month
      mockPrisma.auditLog.groupBy
        .mockResolvedValueOnce([{ module: "orders", _count: 10 }])
        .mockResolvedValueOnce([{ action: "CREATE", _count: 15 }]);

      const result = await service.getStats();
      expect(result.todayCount).toBe(5);
      expect(result.monthCount).toBe(20);
      expect(result.byModule).toHaveLength(1);
      expect(result.byAction).toHaveLength(1);
    });
  });
});
