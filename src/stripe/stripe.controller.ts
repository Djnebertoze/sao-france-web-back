import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UniqueJwtGuard } from "../auth/guards/unique-jwt.guard";
import { User } from "../auth/decorators/users.decorator";
import { UserEntity } from "../users/entities/user.entity";

@Controller('stripe')
export class StripeController {

  constructor(private stripeService: StripeService) {}

  @Get('products')
  getStripeProducts(){
    return this.stripeService.getStripeProducts();
  }

  @Get('prices/active')
  getActiveStripePrices(){
    return this.stripeService.getActiveStripePrices();
  }

  @Get('price/:id')
  getStripePriceById(@Param('id') id:string){
    return this.stripeService.getStripePriceById(id);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Get('paymentLink/:productId')
  getPaymentLink(@User() user: UserEntity, @Param('productId') productId:string){
    return this.stripeService.getStripePaymentLink(user, productId);
  }

  @UseGuards(JwtAuthGuard, UniqueJwtGuard)
  @Post('paymentSuccess/:productId')
  paymentSuccess(@User() user: UserEntity, @Param('productId') productId: string, @Body() body: { status: string, session_id: string }) {
    return this.stripeService.updateStripePaymentStatusToSuccess(user, productId, body);
  }
}
