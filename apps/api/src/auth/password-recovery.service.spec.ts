import { BadRequestException } from "@nestjs/common";
import { PasswordRecoveryService } from "./password-recovery.service";

describe("PasswordRecoveryService", () => {
  let service: PasswordRecoveryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      passwordResetToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new PasswordRecoveryService(mockPrisma as any, {} as any);
  });

  describe("generateResetToken", () => {
    it("should return success even if user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.generateResetToken("nonexistent@test.com");
      expect(result.message).toContain("Si el email existe");
    });

    it("should create token for existing user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "test@test.com" });
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue([]);
      mockPrisma.passwordResetToken.create.mockResolvedValue({});
      const result = await service.generateResetToken("test@test.com");
      expect(result.message).toContain("Si el email existe");
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should throw if token is invalid", async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword("invalid", "newpass123")).rejects.toThrow(BadRequestException);
    });

    it("should throw if token is expired", async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "t1", token: "expired-token", used: false,
        expiresAt: new Date(Date.now() - 10000),
        userId: "user-1", user: { id: "user-1" },
      });
      await expect(service.resetPassword("expired-token", "newpass123")).rejects.toThrow(BadRequestException);
    });

    it("should throw if password is too short", async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "t1", token: "valid-token", used: false,
        expiresAt: new Date(Date.now() + 60000),
        userId: "user-1", user: { id: "user-1" },
      });
      await expect(service.resetPassword("valid-token", "short")).rejects.toThrow(BadRequestException);
    });
  });
});
