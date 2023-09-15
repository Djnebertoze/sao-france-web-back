import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Verifies if the user exists and then issues an access token
  //@UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.getOrGenerateJwt(req.body);
  }
}
