import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { UserEntity } from "../users/entities/user.entity";
import { ShopProductDto } from "./dto/shopProductDto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShopProduct, ShopProductDocument } from "./schema/shopProducts.schema";
import { UsersService } from "../users/users.service";
import { TransactionsService } from "../transactions/transactions.service";
import { McProfile, McProfileDocument } from "../users/schema/mcProfiles.schema";

/**
 * Service for managing the shop products.
 */
@Injectable()
export class ShopService {


  constructor(
    @InjectModel(ShopProduct.name, 'app-db') private shopProductModel: Model<ShopProductDocument>,
    @InjectModel(McProfile.name, "app-db") private mcProfileModel: Model<McProfileDocument>,
    private usersServices: UsersService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService
  ) {}

  /**
   * Creates a new shop product.
   * @param user The user creating the product.
   * @param createShopProductDto The data for the new product.
   * @returns An object indicating success or failure.
   */
  async createShopProduct(user: UserEntity, createShopProductDto: ShopProductDto){
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
      const roleInitial:string = createShopProductDto.roleInitial
      const roleFinal:string = createShopProductDto.roleFinal
      const cosmeticToGive:string = createShopProductDto.cosmeticToGive
      const bonusShopPoints:number = createShopProductDto.bonusShopPoints

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
        cosmeticToGive: cosmeticToGive,
        bonusShopPoints: bonusShopPoints,
        roleInitial: roleInitial,
        roleFinal: roleFinal,
      })
      return { success: true };


    } catch (e: any) {
      console.log(e)
      return { success: true, error: e }
    }
  }


  /**
   * Edits an existing shop product.
   * @param id The ID of the product to edit.
   * @param shopProductDto The updated data for the product.
   * @returns An object indicating success or failure.
   */
  async editShopProduct(id: string, shopProductDto:ShopProductDto){
    try {
      await this.shopProductModel.findOneAndUpdate({_id: id}, shopProductDto)

      return { success: true };

    } catch (e: any) {
      return { success: true, error: e }
    }
  }

  /**
   * Removes a shop product.
   * @param user The user removing the product.
   * @param id The ID of the product to remove.
   * @returns An object indicating success or failure.
   */
  async removeShopProduct(user:UserEntity, id: string){
    try {

      await this.shopProductModel.findOneAndDelete({_id: id})

      return { success: true };

    } catch (e: any) {
      return { success: false, error: e }
    }
  }

  /**
   * Gets all shop products.
   * @returns An object containing an array of shop products and success status.
   */
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

  /**
   * Gets all active shop products.
   * @returns An object containing an array of shop products and success status.
   */
  async getActiveProducts(){
    try {
      return {
        products: await this.shopProductModel.find({active: true}), success: true
      };
    } catch (error:any){
      console.log(error)
      return { ...error, success: false };
    }
  }

  /**
   * Gets a specific shop product by its ID.
   * @param productId The ID of the product to retrieve.
   * @returns An object containing the requested product and success status.
   */
  async getProduct(productId:string){
    try {
      return {product: await this.shopProductModel.findOne({_id: productId}), success: true};
    } catch (error:any){
      return { ...error, success: false };
    }
  }

  /**
   * Collects a product for a user.
   * @param product The product to collect.
   * @param user The user to collect the product for.
   * @returns A boolean indicating success or failure.
   */
  async collectProduct(product: ShopProduct, user:UserEntity) {

    if (product.categorieId == 'grades'){

      await this.usersServices.addRole(user, product.roleToGive)

    } else if (product.categorieId == 'points') {

      await this.usersServices.addShopPoints(user, product.pointsToGive)

    } else if (product.categorieId == 'cosmetiques') {
      // TODO: Give cosmetics
    }

    if (product.bonusShopPoints){
      await this.usersServices.addShopPoints(user, product.bonusShopPoints)
    }
    console.log('Gave ' + product.name + ' to ' + user.username)
    return true;
  }

  /**
 * Pays a product with shop points.
 * @param productId The ID of the product to pay.
 * @param user The user paying for the product.
 * @returns An object indicating success or failure.
 * @throws Will throw an error if the product is not found, the user's Minecraft profile is not connected,
 * the product is a real money product, the user does not have enough shop points, or if there is an error during the transaction.
 */
async payProductWithShopPoints(productId: string, user:UserEntity) {
  const product = await this.getProduct(productId).then((product) => product.product);
  const mcProfile = await this.mcProfileModel.findOne({ user: user })

  // Check if product exists
  if(!product){
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Produit introuvable.'
    }
  }

  // Check if user's Minecraft profile is connected
  if(!mcProfile){
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Compte Minecraft non connecté.'
    }
  }

  // Check if product is a real money product
  if (product.isRealMoney){
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Impossible de payer avec des points boutique.'
    }
  }

  // Check if user has enough shop points
  if (user.shopPoints < product.price){
    return {
      status: HttpStatus.BAD_REQUEST,
      message: 'Solde insuffisant.'
    }
  }

  try {
    // Remove shop points from user's account
    const removedPoints = await this.usersServices.removeShopPoints(user, product.price)
    if(removedPoints){
      // Create a transaction
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

  /**
   * Gets all confirmed transactions for in-game claims.
   * @returns An array of confirmed transactions.
   */
  async getInGameClaims(){
    return await this.transactionsService.getConfirmedTransactions();
  }

  /**
   * Claims an in-game product for a user.
   * @param transactionId The ID of the transaction to claim.
   * @returns An object indicating success or failure.
   */
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
  /**
   * Gets all confirmed transactions for in-game claims (TEMP).
   * @returns An array of confirmed transactions.
   */
  async getInGameClaims2(){
    return await this.transactionsService.getConfirmedTransactions2();
  }

  // TEMP for multi server
  /**
   * Claims an in-game product for a user (TEMP for multi server).
   * @param transactionId The ID of the transaction to claim.
   * @returns An object indicating success or failure.
   */
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

  /**
   * Adds shop points to a user's account.
   * @param user The user to add points to.
   * @param toGiveUserId The ID of the user whose account will receive the points.
   * @param numberOfPoints The number of points to add.
   * @returns An object indicating success or failure.
   */
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
        place: null,
        bonusShopPoints: null,
        active: true,
        roleInitial: null,
        roleFinal: null
      },
      mcProfile: null,
      cost: 0,
      isRealMoney: false,
      createdBy: user,
      shopProductId: numberOfPoints+'_admin_points',
      status: 'claimed2',
      productName: productName
    }, true)
  }

  /**
   * Removes shop points from a user's account.
   * @param user The user to remove points from.
   * @param toGiveUserId The ID of the user whose account will lose the points.
   * @param numberOfPoints The number of points to remove.
   * @returns An object indicating success or failure.
   */
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
            place: null,
            bonusShopPoints: null,
            active: true,
            roleInitial: null,
            roleFinal: null,
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