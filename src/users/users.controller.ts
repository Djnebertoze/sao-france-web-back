import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query, Request,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { UserEntity } from "./entities/user.entity";
import { User } from 'src/auth/decorators/users.decorator';
import { UpdateUserDto } from "./dto/update-user.dto";
import { GetMicrosoftAccessTokenDto } from "./dto/get-microsoft-access-token.dto";


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
    return this.usersService.getUserPrivateProfile(user);
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

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Post('requestXboxServices')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  requestXboxServices(@User() user: UserEntity, @Request() req){
    return this.usersService.requestXboxServices(user, req);
  }

}
