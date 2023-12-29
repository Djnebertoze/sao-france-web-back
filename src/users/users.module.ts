import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/users.schema';
import { UserToken, UserTokenSchema } from './schema/usersTokens.schema';
import { SignatureTokens, SignatureTokensSchema } from "./schema/signatureTokens.schema";
import { McProfile, McProfileSchema } from "./schema/mcProfiles.schema";
import { ShopModule } from "../shop/shop.module";
import { JwtModule } from "@nestjs/jwt";
import { LocalStrategy } from "../auth/strategies/local.strategy";
import { JwtStrategy } from "../auth/strategies/jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule } from "@nestjs/config";
import { MailSenderService } from "../mail-sender/mail-sender.service";

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    MongooseModule.forFeatureAsync(
      [
        {
          name: User.name,
          useFactory: () => {
            return UserSchema;
          },
        },
        {
          name: UserToken.name,
          useFactory: () => {
            return UserTokenSchema;
          },
        },
        {
          name: SignatureTokens.name,
          useFactory: () => {
            return SignatureTokensSchema;
          },
        },
        {
          name: McProfile.name,
          useFactory: () => {
            return McProfileSchema;
          },
        },
      ],
      'app-db'
    ),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, MailSenderService],
  exports: [UsersService],
})
export class UsersModule {}
