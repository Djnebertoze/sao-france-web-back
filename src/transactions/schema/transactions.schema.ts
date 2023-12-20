import { User } from "../../users/schema/users.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";


export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: { select: '_id email username firstName lastName shopPoints profilePicture createdAt' },
  })
  author: User

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ required: true })
  isRealMoney: boolean;

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  productName: string

  @Prop({ required: true })
  shopProductId: string

  // ONLY IF STRIPE PAYMENT
  @Prop({ required: false })
  mode: string

  @Prop({ required: false })
  session_id: string

  @Prop({ required: false })
  stripeProductId: string
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
