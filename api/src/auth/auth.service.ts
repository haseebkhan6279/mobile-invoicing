import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";

type TokenUser = { id: string; email: string; name: string };

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  private async issueTokenPair(user: TokenUser) {
    const base = { sub: user.id, email: user.email, name: user.name };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ ...base, type: "access" }, { expiresIn: "12h" }),
      this.jwt.signAsync({ ...base, type: "refresh" }, { expiresIn: "30d" }),
    ]);
    return { accessToken, refreshToken, expiresIn: 12 * 60 * 60, tokenType: "Bearer" as const };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException("Invalid email or password");
    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    const tokens = await this.issueTokenPair(user);
    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    if (payload.type !== "refresh") throw new UnauthorizedException("Invalid token type");

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException("User not found");

    return this.issueTokenPair(user);
  }
}
