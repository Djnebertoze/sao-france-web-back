import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { StripeController } from "./stripe.controller";
import { StripeService } from "./stripe.service";
import { TransactionsModule } from "../transactions/transactions.module";
import { ShopModule } from "../shop/shop.module";

@Module({
  imports: [
    UsersModule,
    TransactionsModule,
    ShopModule
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService]
})
export class StripeModule {}
