import { Module } from '@nestjs/common';
import { StatisticsController } from "./statistics.controller";
import { StatisticsService } from "./statistics.service";
import { UsersModule } from "../users/users.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { ShopModule } from "../shop/shop.module";
import { StripeModule } from "../stripe/stripe.module";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../users/schema/users.schema";
import { UserToken, UserTokenSchema } from "../users/schema/usersTokens.schema";
import { SignatureTokens, SignatureTokensSchema } from "../users/schema/signatureTokens.schema";
import { McProfile, McProfileSchema } from "../users/schema/mcProfiles.schema";
import { Transaction, TransactionSchema } from "../transactions/schema/transactions.schema";

@Module({
  imports: [
    UsersModule,
    TransactionsModule,
    ShopModule,
    StripeModule,
    MongooseModule.forFeatureAsync(
      [
        {
          name: User.name,
          useFactory: () => {
            return UserSchema;
          },
        },
        {
          name: McProfile.name,
          useFactory: () => {
            return McProfileSchema;
          },
        },
        {
          name: Transaction.name,
          useFactory: () => {
            return TransactionSchema;
          },
        },
      ],
      'app-db'
    ),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService]
})
export class StatisticsModule {}
