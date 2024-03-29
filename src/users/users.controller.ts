import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { UserEntity } from "./entities/user.entity";
import { User } from "src/auth/decorators/users.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/roles/roles.enum";


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get('profile')
  getUserPrivateProfile(@User() user: UserEntity) {
    return this.usersService.getUserPrivateProfile(user._id);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard, RolesGuard)
  @Post('addRole')
  async addRole( @Body() body: { email: string, roleId: string }) {
    const user = await this.usersService.getUserByEmail(body.email);
    if(!user){
      return {
        status: 404,
        message: 'User not found.'
      }
    }
    return this.usersService.addRole(user, body.roleId);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard, RolesGuard)
  @Post('removeRole')
  async removeRole( @Body() body: { email: string, roleId: string }) {
    const user = await this.usersService.getUserByEmail(body.email);
    if(!user){
      return {
        status: 404,
        message: 'User not found.'
      }
    }
    return this.usersService.removeRole(user, body.roleId);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get('user/:id')
  getUserPrivateProfileById(@Param('id') id: string) {
    return this.usersService.getUserPrivateProfile(id);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get('profile/:id')
  getUserPublicProfile(@Param('id') id: string) {
    return this.usersService.getUserPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Put()
  update(@User() user: UserEntity, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user, updateUserDto);
  }

  @Get('send-password-reset/:email')
  sendPasswordReset(@Param('email') email: string) {
    return this.usersService.sendPasswordReset(email);
  }

  @Post('reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() body: { password: string }) {
    return this.usersService.resetPassword(token, body);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get()
  getAll() {
    return this.usersService.findAll()
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Post('requestXboxServices')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  requestXboxServices(@User() user: UserEntity, @Request() req){
    return this.usersService.requestXboxServices(user, req);
  }
}
