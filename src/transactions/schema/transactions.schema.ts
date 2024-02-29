import { User } from "../../users/schema/users.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { ShopProduct } from "../../shop/schema/shopProducts.schema";
import { McProfile } from "../../users/schema/mcProfiles.schema";


export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: { select: 'email username' },
  })
  author: User

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ required: false })
  mcProfile: McProfile

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

  @Prop({ required: false })
  shopProduct: ShopProduct
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
