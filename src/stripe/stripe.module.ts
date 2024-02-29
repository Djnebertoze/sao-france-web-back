import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { StripeController } from "./stripe.controller";
import { StripeService } from "./stripe.service";
import { TransactionsModule } from "../transactions/transactions.module";
import { ShopModule } from "../shop/shop.module";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopProduct, ShopProductSchema } from "../shop/schema/shopProducts.schema";
import { McProfile, McProfileSchema } from "../users/schema/mcProfiles.schema";

@Module({
  imports: [
    UsersModule,
    TransactionsModule,
    ShopModule,
    MongooseModule.forFeatureAsync(
      [
        {
          name: McProfile.name,
          useFactory: () => {
            return McProfileSchema;
          },
        }
      ],
      "app-db"
    )
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService]
})
export class StripeModule {}
