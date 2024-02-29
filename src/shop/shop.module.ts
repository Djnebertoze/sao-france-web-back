import { forwardRef, Module } from "@nestjs/common";
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { MongooseModule } from "@nestjs/mongoose";
import { ShopProduct, ShopProductSchema } from "./schema/shopProducts.schema";
import { UsersModule } from "../users/users.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { McProfile, McProfileSchema } from "../users/schema/mcProfiles.schema";

@Module({
  imports: [
    UsersModule,
    TransactionsModule,
    MongooseModule.forFeatureAsync(
      [
        {
          name: ShopProduct.name,
          useFactory: () => {
            return ShopProductSchema;
          },
        },
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
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService]
})
export class ShopModule {}
