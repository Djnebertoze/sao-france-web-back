import { Injectable } from '@nestjs/common';
import { UserEntity } from "../users/entities/user.entity";
import { ShopProductDto } from "./dto/shopProductDto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShopProduct, ShopProductDocument } from "./schema/shopProducts.schema";
import { UsersService } from "../users/users.service";

@Injectable()
export class ShopService {

  constructor(
    @InjectModel(ShopProduct.name, 'app-db') private shopProductModel: Model<ShopProductDocument>,
    private usersServices: UsersService
  ) {}

  async createShopProduct(user: UserEntity, createShopProductDto: ShopProductDto){
    console.log(createShopProductDto)
    try {

      const place = await this.shopProductModel.countDocuments({categorieId: createShopProductDto.categorieId});
      console.log('ok')
      const price:number = createShopProductDto.price;
      const name:string = createShopProductDto.name;
      const description:string = createShopProductDto.description;
      const categorieId:string = createShopProductDto.categorieId;
      const isRealMoney:boolean = createShopProductDto.isRealMoney;
      const imageUrl:string = createShopProductDto.imageUrl;
      console.log('ok1')

      /*const newProduct = await this.shopProductModel.create({
        ...createShopProductDto,
        place: place
      })*/

      await this.shopProductModel.create({
        place: place,
        name: name,
        description: description,
        categorieId: categorieId,
        price: price,
        isRealMoney: isRealMoney,
        imageUrl: imageUrl,
      })

      console.log('ok2')
      return { success: true };


    } catch (e: any) {
      return { success: true, error: e }
    }
  }

  async editShopProduct(user:UserEntity, id: string, shopProductDto:ShopProductDto){
    try {

      await this.shopProductModel.findOneAndUpdate({_id: id}, shopProductDto)

      return { success: true };

    } catch (e: any) {
      return { success: true, error: e }
    }
  }

  async removeShopProduct(user:UserEntity, id: string){
    try {

      await this.shopProductModel.findOneAndDelete({_id: id})

      return { success: true };

    } catch (e: any) {
      return { success: true, error: e }
    }
  }

  async getProducts(user:UserEntity){
    try {
      return {products: await this.shopProductModel.find({}, "_id name description price isRealMoney imageUrl categorieId place"), success: true};
    } catch (error:any){
      return { ...error, success: false };
    }
  }

  async getProduct(productId:string, user:UserEntity){
    try {
      return {product: await this.shopProductModel.findOne({_id: productId}, "_id name description price isRealMoney imageUrl categorieId place"), success: true};
    } catch (error:any){
      return { ...error, success: false };
    }
  }
}