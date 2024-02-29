import { User } from "../../users/schema/users.schema";
import { UserEntity } from "../../users/entities/user.entity";
import { ShopProduct } from "../../shop/schema/shopProducts.schema";
import { McProfile } from "../../users/schema/mcProfiles.schema";


export interface CreateTransactionDto {
  author: User | UserEntity;
  isRealMoney: boolean;
  cost: number;
  status: string;
  productName: string;
  mode?: string;
  session_id?: string;
  shopProductId: string;
  stripeProductId?: string;
  shopProduct?: ShopProduct
  mcProfile?: McProfile
}