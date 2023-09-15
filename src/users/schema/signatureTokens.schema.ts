import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from "./users.schema";

export type SignatureTokensDocument = SignatureTokens & Document;

@Schema({ timestamps: true })
export class SignatureTokens {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  issuedAt: number;

  @Prop({ required: true })
  expiresAt: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: { select: '_id firstName username email createdAt' },
  })
  user: User;
}

export const SignatureTokensSchema = SchemaFactory.createForClass(SignatureTokens);
