import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: false })
  birthday: string;

  @Prop({
    default:
      'https://www.murrayglass.com/wp-content/uploads/2020/10/avatar-768x768.jpeg',
  })
  profilePicture: string;

  @Prop({ default: ['user'] })
  roles: string[];

  @Prop({ default: 0 })
  shopPoints: number;

  @Prop({ required: true })
  acceptEmails: boolean;

  @Prop({ default: "Joueur SAO"})
  bio: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
