import { ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as any;
    guard = new AuthGuard(jwtService);
  });

  function mockCtx(authorization?: string) {
    const headers: any = authorization ? { authorization } : {};
    const req: any = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  }

  it("rejects when no authorization header", async () => {
    expect(await guard.canActivate(mockCtx())).toBe(false);
  });

  it("rejects when token is invalid", async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error("invalid"));
    expect(await guard.canActivate(mockCtx("Bearer invalid-token"))).toBe(false);
  });

  it("accepts and attaches user when token is valid", async () => {
    const payload = { sub: "123", email: "test@test.com", roles: ["ADMIN"] };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
    const ctx = mockCtx("Bearer valid-token");

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    const req = (ctx.switchToHttp().getRequest() as any);
    expect(req.user).toEqual(payload);
  });

  it("rejects non-Bearer tokens", async () => {
    expect(await guard.canActivate(mockCtx("Basic some-token"))).toBe(false);
  });
});
