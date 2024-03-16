import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { UserEntity } from "../users/entities/user.entity";
import { ShopProductDto } from "./dto/shopProductDto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShopProduct, ShopProductDocument } from "./schema/shopProducts.schema";
import { UsersService } from "../users/users.service";
import { TransactionsService } from "../transactions/transactions.service";
import { McProfile, McProfileDocument } from "../users/schema/mcProfiles.schema";

@Injectable()
export class ShopService {


  constructor(
    @InjectModel(ShopProduct.name, 'app-db') private shopProductModel: Model<ShopProductDocument>,
    @InjectModel(McProfile.name, "app-db") private mcProfileModel: Model<McProfileDocument>,
    private usersServices: UsersService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService
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
      const cosmeticToGive:string = createShopProductDto.cosmeticToGive

      await this.shopProductModel.create({
        place: place,
        name: name,
        description: description,
        categorieId: categorieId,
        price: price,
        isRealMoney: isRealMoney,
        imageUrl: imageUrl,
        stripeLink: stripeLink,
        descriptionDetails: descriptionDetails,
        pointsToGive: pointsToGive,
        roleToGive: roleToGive,
        cosmeticToGive: cosmeticToGive
      })
      return { success: true };


    } catch (e: any) {
      console.log(e)
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

  async collectProduct(product: ShopProduct, user:UserEntity) {

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

  async payProductWithShopPoints(productId: string, user:UserEntity) {
    const product = await this.getProduct(productId).then((product) => product.product);
    const mcProfile = await this.mcProfileModel.findOne({ user: user })
    if(!product){
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Produit introuvable.'
      }
    }

    if(!mcProfile){
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Compte Minecraft non connecté.'
      }
    }

    if (product.isRealMoney){
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Impossible de payer avec des points boutique.'
      }
    }

    if (user.shopPoints < product.price){
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Solde insuffisant.'
      }
    }

    try {
      const removedPoints = await this.usersServices.removeShopPoints(user, product.price)
      if(removedPoints){
        await this.transactionsService.createTransaction({
          author: user,
          shopProductId: productId,
          isRealMoney: false,
          status: 'confirmed',
          cost: product.price,
          productName: product.name,
          shopProduct: product,
          mcProfile: mcProfile
        })
        return {
          status: HttpStatus.CREATED
        }
      } else {
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Impossible de retirer les points'
        }
      }

    } catch (error){
      console.log(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
        message: 'Erreur interne lors de la transaction.'
      }
    }

  }

  async getInGameClaims(){
    const transactions = await this.transactionsService.getConfirmedTransactions();
    return transactions;
  }

  async claimInGame(transactionId: string) {
    try {
      await this.transactionsService.changeStatusToClaimed(transactionId)
    } catch (e){
      console.log(e)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: e,
        message: 'Erreur interne lors de la récupération.'
      }
    }
  }

  // TEMP
  async getInGameClaims2(){
    const transactions = await this.transactionsService.getConfirmedTransactions2();
    return transactions;
  }

  // TEMP for multi server
  async claimInGame2(transactionId: string) {
    try {
      await this.transactionsService.changeStatusToClaimed2(transactionId)
    } catch (e){
      console.log(e)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: e,
        message: 'Erreur interne lors de la récupération.'
      }
    }
  }

  async addShopPoints(user: UserEntity, toGiveUserId: string, numberOfPoints: number){

    const author: UserEntity = await this.usersServices.getUserById(toGiveUserId)

    const productName = numberOfPoints + " points boutiques"

    return this.transactionsService.createTransaction({
      author: author,
      shopProduct: {
        name: productName,
        description: 'admin points',
        descriptionDetails: 'admin points',
        imageUrl: 'https://www.saofrance.net/_next/static/media/MainLogo.83e8c21b.png',
        categorieId: 'points',
        price: 0,
        isRealMoney: false,
        pointsToGive: numberOfPoints,
        roleToGive: null,
        cosmeticToGive: null,
        stripeLink: null,
        place: null
      },
      mcProfile: null,
      cost: 0,
      isRealMoney: false,
      createdBy: user,
      shopProductId: numberOfPoints+'_admin_points',
      status: 'claimed2',
      productName: productName
    })
  }

  async removeShopPoints(user: UserEntity, toGiveUserId: string, numberOfPoints: number){
    const author: UserEntity = await this.usersServices.getUserById(toGiveUserId)

    const productName = "-" + numberOfPoints + " points boutiques"

    try {
        return this.transactionsService.createTransaction({
          author: author,
          shopProduct: {
            name: productName,
            description: 'admin points',
            descriptionDetails: 'admin points',
            imageUrl: 'https://www.saofrance.net/_next/static/media/MainLogo.83e8c21b.png',
            categorieId: 'points',
            price: 0,
            isRealMoney: false,
            pointsToGive: -numberOfPoints,
            roleToGive: null,
            cosmeticToGive: null,
            stripeLink: null,
            place: null
          },
          mcProfile: null,
          cost: 0,
          isRealMoney: false,
          createdBy: user,
          shopProductId: '-'+numberOfPoints+'_admin_points',
          status: 'claimed2',
          productName: productName
        }, true);
    } catch (e){
      console.log(e)
    }

  }
}