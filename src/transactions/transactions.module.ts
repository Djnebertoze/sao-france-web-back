import { forwardRef, Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Transaction, TransactionSchema } from "./schema/transactions.schema";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { ShopModule } from "../shop/shop.module";
import { MailSenderService } from "../mail-sender/mail-sender.service";

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ShopModule),
    MongooseModule.forFeatureAsync(
      [
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
  controllers: [TransactionsController],
  providers: [TransactionsService, MailSenderService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
