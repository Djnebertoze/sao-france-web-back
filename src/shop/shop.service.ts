import { Injectable } from '@nestjs/common';
import { UserEntity } from "../users/entities/user.entity";
import { ShopProductDto } from "./dto/shopProductDto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShopProduct, ShopProductDocument } from "./schema/shopProducts.schema";
import { UsersService } from "../users/users.service";
import { Cron, CronExpression } from "@nestjs/schedule";

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
      const price:number = createShopProductDto.price;
      const name:string = createShopProductDto.name;
      const description:string = createShopProductDto.description;
      const categorieId:string = createShopProductDto.categorieId;
      const isRealMoney:boolean = createShopProductDto.isRealMoney;
      const imageUrl:string = createShopProductDto.imageUrl;
      const stripeLink:string = createShopProductDto.stripeLink;
      const descriptionDetails:string = createShopProductDto.descriptionDetails
      const pointsToGive:number = createShopProductDto.pointsToGive
      const roleToGive:string = createShopProductDto.roleToGive

      await this.shopProductModel.create({
        place: place,
        name: name,
        description: description,
        categorieId: categorieId,
        price: price,
        isRealMoney: isRealMoney,
        imageUrl: imageUrl,
        stripLink: stripeLink,
        descriptionDetails: descriptionDetails,
        pointsToGive: pointsToGive,
        roleToGive: roleToGive
      })
      return { success: true };


    } catch (e: any) {
      return { success: true, error: e }
    }
  }



  async editShopProduct(id: string, shopProductDto:ShopProductDto){
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
      return { success: false, error: e }
    }
  }

  async getProducts(){
    try {
      return {
        products: await this.shopProductModel.find(), success: true
      };
    } catch (error:any){
      console.log(error)
      return { ...error, success: false };
    }
  }

  async getProduct(productId:string){
    try {
      return {product: await this.shopProductModel.findOne({_id: productId}), success: true};
    } catch (error:any){
      return { ...error, success: false };
    }
  }

  async collectProduct(productId: string, user:UserEntity) {
    const product = await this.getProduct(productId).then((product) => product.product);

    if (product.categorieId == 'grades'){

      await this.usersServices.addRole(user, product.roleToGive)

    } else if (product.categorieId == 'points') {

      await this.usersServices.addShopPoints(user, product.pointsToGive)

    } else if (product.categorieId == 'cosmetiques') {
      // TODO: Give cosmetics
    }
    console.log('Gave ' + product.name + ' to ' + user.username)
    return true;
  }
}