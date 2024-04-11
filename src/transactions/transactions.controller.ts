import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { User } from "../auth/decorators/users.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { TransactionsService } from "./transactions.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/roles/roles.enum";

@Controller('transactions')
export class TransactionsController {

  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get()
  async getTransactions(@User() user: UserEntity){
    return this.transactionsService.getTransactionsOf(user);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get('all')
  async getAllTransactions(){
    return this.transactionsService.getAllTransactions()
  }
  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get('some/:page/:size/:filters')
  async getSizedListTransactions(@Param('page') pageNumber: number, @Param('size') pageSize: number, @Param('filters') filters: string){
    return this.transactionsService.getSizedListTransactions(pageNumber, pageSize, filters)
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get(':id')
  async getTransaction(@Param('id') transactionId: string){
    return this.transactionsService.getTransaction(transactionId);
  }
}
