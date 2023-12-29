import { Controller, Post, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Verifies if the user exists and then issues an access token
  //@UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return await this.authService.getOrGenerateJwt(req.body);
  }
}
