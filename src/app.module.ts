import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ShopModule } from './shop/shop.module';
import { StripeService } from './stripe/stripe.service';
import { StripeController } from './stripe/stripe.controller';
import { StripeModule } from './stripe/stripe.module';
import { TransactionsService } from './transactions/transactions.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionsModule } from './transactions/transactions.module';
import * as process from "process";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.APP_DATABASE_URL,
        dbName: process.env.ENV == 'PROD' ? 'production' : 'test',
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
    StripeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
