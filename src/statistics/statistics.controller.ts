import { Controller, Get, UseGuards } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/roles/roles.enum";

@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Roles(Role.ADMIN, Role.RESPONSABLE, Role.MODERATOR, Role.STAFF)
  @Get('admin')
  getAdminStats(){
    return this.statisticsService.getAdminStats()
  }
}
