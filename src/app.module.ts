import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.APP_DATABASE_URL,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
