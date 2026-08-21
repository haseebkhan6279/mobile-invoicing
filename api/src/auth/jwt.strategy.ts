import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";

type ApiTokenPayload = { sub: string; email: string; name: string; type: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("API_JWT_SECRET"),
    });
  }

  // Re-checks the user still exists on every request (not just trusting the payload),
  // so a deleted user's still-unexpired tokens stop working immediately.
  async validate(payload: ApiTokenPayload) {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException("User not found");
    return { id: user.id, email: user.email, name: user.name };
  }
}
