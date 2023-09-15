import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ShopProductDocument = ShopProduct & Document;

@Schema({ timestamps: true })
export class ShopProduct {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  isRealMoney: boolean;

  @Prop({ required: true })
  categorieId: string;

  @Prop({ required: true })
  place: number;
}

export const ShopProductSchema = SchemaFactory.createForClass(ShopProduct);
