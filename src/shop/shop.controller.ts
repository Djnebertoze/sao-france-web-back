import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ShopService } from "./shop.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { User } from "../auth/decorators/users.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { ShopProductDto } from "./dto/shopProductDto";
import { TransactionsService } from "../transactions/transactions.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/roles/roles.enum";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
  ) {}

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Post("createProduct")
  createProduct(@User() user: UserEntity, @Body() createShopProductDto: ShopProductDto){
    return this.shopService.createShopProduct(user, createShopProductDto);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Put("editProduct/:id")
  editProduct(@User() user: UserEntity, @Param('id') id:string, @Body() shopProductDto: ShopProductDto){
    return this.shopService.editShopProduct(id, shopProductDto);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Post("removeProduct/:id")
  removeProduct(@User() user: UserEntity, @Param('id') id:string){
    return this.shopService.removeShopProduct(user, id);
  }

  @Get('products')
  getProducts(){
    return this.shopService.getProducts();
  }

  @Get('products/active')
  getActiveProducts(){
    return this.shopService.getActiveProducts();
  }

  @Get('product/:id')
  getProduct(@Param('id') id: string){
    return this.shopService.getProduct(id);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Post('pay/:id')
  payProduct(@User() user: UserEntity, @Param('id') productId:string){
    return this.shopService.payProductWithShopPoints(productId, user);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard, RolesGuard)
  @Post('addShopPoints/:userId')
  giveShopPoints(@User() user: UserEntity, @Param('userId') toGiveUserId:string, @Body() numberOfPoint: { points:number }){
    return this.shopService.addShopPoints(user, toGiveUserId, numberOfPoint.points);
  }

  @Roles(Role.ADMIN, Role.RESPONSABLE)
  @UseGuards(JwtAuthGuard, UniqueJwtGuard, RolesGuard)
  @Post('removeShopPoints/:userId')
  removeShopPoints(@User() user: UserEntity, @Param('userId') toRemoveUserId:string, @Body() numberOfPoint: { points:number }){
    return this.shopService.removeShopPoints(user, toRemoveUserId, numberOfPoint.points);
  }

  @Get('inGameClaims')
  getInGameClaims(){
    return this.shopService.getInGameClaims()
  }

  @Get('claimInGame/:id')
  claimInGame(@Param('id') transactionId:string){
    return this.shopService.claimInGame(transactionId);
  }


  // TEMP
  @Get('inGameClaims2')
  getInGameClaims2(){
    return this.shopService.getInGameClaims2()
  }


  // TEMP
  @Get('claimInGame2/:id')
  claim2InGame(@Param('id') transactionId:string){
    return this.shopService.claimInGame2(transactionId);
  }
}