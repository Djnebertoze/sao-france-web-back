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
  createdBy?: User | UserEntity;
  mode?: string | undefined;
  session_id?: string | undefined;
  shopProductId: string;
  stripeProductId?: string | undefined;
  shopProduct?: ShopProduct
  mcProfile?: McProfile | undefined
}