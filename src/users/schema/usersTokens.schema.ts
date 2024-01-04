import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserTokenDocument = UserToken & Document;

@Schema({ timestamps: true })
export class UserToken {
  @Prop({ unique: true, required: true })
  accessToken: string;

  @Prop({ required: true })
  issuedAt: number;

  @Prop({ required: true })
  expiresAt: number;

  @Prop({ unique: true, required: true })
  userId: string;

  @Prop({ required: false })
  firstName: string;

  @Prop({ required: false })
  lastName: string;
}

export const UserTokenSchema = SchemaFactory.createForClass(UserToken);
