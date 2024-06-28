import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ShopProductDocument = ShopProduct & Document;

@Schema({ timestamps: true })
export class ShopProduct {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  descriptionDetails: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: false })
  isRealMoney: boolean;

  @Prop({ required: true })
  categorieId: string;

  @Prop({ required: false })
  place: number | undefined;

  @Prop({ required: false })
  stripeLink: string | undefined;

  @Prop({ required: false })
  pointsToGive: number | undefined;

  @Prop({ required: false })
  bonusShopPoints: number | undefined;

  @Prop({ required: false })
  roleToGive: string | undefined;

  @Prop({ required: false })
  cosmeticToGive: string | undefined;

  @Prop({ required: true, default: true })
  active: boolean;
}

export const ShopProductSchema = SchemaFactory.createForClass(ShopProduct);
