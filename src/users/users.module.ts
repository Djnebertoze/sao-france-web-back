import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/users.schema';
import { UserToken, UserTokenSchema } from './schema/usersTokens.schema';
import { SignatureTokens, SignatureTokensSchema } from "./schema/signatureTokens.schema";
import { McProfile, McProfileSchema } from "./schema/mcProfiles.schema";
import { ShopModule } from "../shop/shop.module";

@Module({
  imports: [
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
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
