import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ScheduleModule } from "@nestjs/schedule";
import { ShopModule } from "./shop/shop.module";
import { StripeModule } from "./stripe/stripe.module";
import { TransactionsModule } from "./transactions/transactions.module";
import * as process from "process";
import { MailSenderService } from "./mail-sender/mail-sender.service";
import { StatisticsService } from './statistics/statistics.service';
import { StatisticsController } from './statistics/statistics.controller';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.APP_DATABASE_URL,
        dbName: process.env.NODE_ENV == 'production' ? 'production' : 'test',
        connectionFactory: (connection) => {
          connection.plugin(require('mongoose-unique-validator'));
          connection.plugin(require('mongoose-autopopulate'));
          return connection;
        },
      }),
      connectionName: 'app-db',
    }),
    AuthModule,
    UsersModule,
    ShopModule,
    TransactionsModule,
    StripeModule,
    StatisticsModule
  ],
  controllers: [AppController],
  providers: [AppService, MailSenderService],
})
export class AppModule {}
