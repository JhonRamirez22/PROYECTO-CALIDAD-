import { PermissionsService } from "./permissions.service";

describe("PermissionsService", () => {
  let service: PermissionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      permission: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new PermissionsService(mockPrisma);
  });

  describe("checkPermission", () => {
    it("should return true when permission is granted", async () => {
      mockPrisma.permission.findUnique.mockResolvedValue({
        canCreate: true,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      });

      expect(await service.checkPermission("ADMIN", "products", "create")).toBe(true);
    });

    it("should return false when permission is denied", async () => {
      mockPrisma.permission.findUnique.mockResolvedValue({
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      });

      expect(await service.checkPermission("COMPRADOR", "products", "delete")).toBe(false);
    });

    it("should return false when no permission record exists", async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      expect(await service.checkPermission("UNKNOWN", "products", "read")).toBe(false);
    });
  });

  describe("seed", () => {
    it("should upsert all default permissions", async () => {
      mockPrisma.permission.upsert.mockResolvedValue({});
      await service.seed();
      expect(mockPrisma.permission.upsert).toHaveBeenCalled();
    });
  });

  describe("getMatrix", () => {
    it("should return permissions organized by role and module", async () => {
      mockPrisma.permission.findMany.mockResolvedValue([
        { role: "ADMIN", module: "products", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
        { role: "COMPRADOR", module: "products", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
      ]);

      const matrix = await service.getMatrix();
      expect(matrix["ADMIN"]["products"].canDelete).toBe(true);
      expect(matrix["COMPRADOR"]["products"].canDelete).toBe(false);
    });
  });
});
