import { forwardRef, Module } from "@nestjs/common";
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { MongooseModule } from "@nestjs/mongoose";
import { ShopProduct, ShopProductSchema } from "./schema/shopProducts.schema";
import { UsersModule } from "../users/users.module";
import { TransactionsModule } from "../transactions/transactions.module";

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
