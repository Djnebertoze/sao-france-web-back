import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { User } from "../auth/decorators/users.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { TransactionsService } from "./transactions.service";

@Controller('transactions')
export class TransactionsController {

  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get()
  async getTransactions(@User() user: UserEntity){
    return this.transactionsService.getTransactionsOf(user);
  }

}
