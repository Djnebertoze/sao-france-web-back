import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from "./users.schema";

export type McProfileDocument = McProfile & Document;

@Schema({ timestamps: true })
export class McProfile {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  uuid: string;

  @Prop({ required: false })
  skinUrl: string;

  @Prop({ required: false })
  skinVariant: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: User;
}

export const McProfileSchema = SchemaFactory.createForClass(McProfile);
