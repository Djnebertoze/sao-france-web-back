import { HttpStatus, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { Transaction, TransactionDocument } from "./schema/transactions.schema";
import { InjectModel } from "@nestjs/mongoose";
import { UsersService } from "../users/users.service";
import { CreateTransactionDto } from "./dto/createTransactionDto";
import { ShopService } from "../shop/shop.service";
import { MailSenderService } from "../mail-sender/mail-sender.service";
import { MailType } from "../mail-sender/mails/mailTypes.enum";
import { UserEntity } from "../users/entities/user.entity";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name, 'app-db') private transactionModel: Model<TransactionDocument>,
    private usersService: UsersService,
    private shopService: ShopService,
    private mailSenderService: MailSenderService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto, disableMails?:boolean) {
    try {
      await this.transactionModel.create({
        author: createTransactionDto.author,
        status: createTransactionDto.status ?? 'pending',
        cost: createTransactionDto.cost,
        productName: createTransactionDto.productName,
        isRealMoney: createTransactionDto.isRealMoney,
        shopProductId: createTransactionDto.shopProductId,
        mode: createTransactionDto.mode ?? null,
        session_id: createTransactionDto.session_id ?? null,
        stripeProductId: createTransactionDto.stripeProductId ?? null,
        shopProduct: createTransactionDto.shopProduct ?? null,
        mcProfile: createTransactionDto.mcProfile ?? null,
        createdBy: createTransactionDto.createdBy
      });

      await this.shopService.collectProduct(createTransactionDto.shopProduct, createTransactionDto.author)

      const product_price_str = `${createTransactionDto.cost}${createTransactionDto.isRealMoney ? '€': ' PB'}`

      if(!disableMails){
        await this.mailSenderService.sendMail({
          receiverEmail: createTransactionDto.author.email,
          subject: `Merci pour votre achat '${createTransactionDto.productName}' x1 !`,
          mailType: MailType.PRODUCT_BUY
        }, {product_name: createTransactionDto.productName, product_price:product_price_str})
      }


      return {
        statusCode: HttpStatus.CREATED,
        message: 'Transaction successfully created'
      }
    } catch (error) {
      console.log('Error ', error.message)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async existsSessionId(sessionId: string) {
    try {
      return await this.transactionModel.exists({session_id: sessionId})
    } catch (error) {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.errors
        }
    }
  }

  async getConfirmedTransactions(){
    try {
      return await this.transactionModel.find({ status: "confirmed" })
        .select('status productName shopProductId shopProduct._id mcProfile.name mcProfile.uuid shopProduct.name shopProduct.categorieId shopProduct.roleToGive shopProduct.pointsToGive shopProduct.cosmeticToGive')
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async changeStatusToClaimed(transactionId: string){
    try {
      await this.transactionModel.findOneAndUpdate({ _id: transactionId }, { status: 'claimed' })
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Status modifié avec succès'
      }
    } catch (error) {
      console.log(error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }

    }
  }

  // TEMP
  async getConfirmedTransactions2(){
    try {
      return await this.transactionModel.find({ status: "claimed" })
        .select('status productName shopProductId shopProduct._id mcProfile.name mcProfile.uuid shopProduct.name shopProduct.categorieId shopProduct.roleToGive shopProduct.pointsToGive shopProduct.cosmeticToGive')
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async getTransactionsOf(user:UserEntity){
    try {
      return await this.transactionModel.find({ author: user });
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async getAllTransactions(){
    try {
      return await this.transactionModel.find().sort({ createdAt: -1 });
    } catch (error) {
      console.log(error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async getSizedListTransactions(pageNumber:number, pageSize:number, filters:string){
    const filtersParsed : {
      author : {
        username?: string,
        email?: string
      },
      isRealMoney?: boolean,
      shopProduct : {
        categorieId?: string
      },
      shopProductId?: string
    } = JSON.parse(filters)

    /*const query = {
      $and: [
        { ...(filtersParsed.author && filtersParsed.author.username && { 'author.username': new RegExp(filtersParsed.author.username, 'i') }) },
        { ...(filtersParsed.author && filtersParsed.author.email && { 'author.email': new RegExp(filtersParsed.author.email, 'i') }) },
        { ...(filtersParsed.isRealMoney && { isRealMoney: filtersParsed.isRealMoney }) },
        { ...(filtersParsed.shopProduct && filtersParsed.shopProduct.categorieId && { 'shopProduct.categorieId': filtersParsed.shopProduct.categorieId }) },
      ]
    };*/

    const query = {};

    if (filtersParsed.author && filtersParsed.author.username) {
      query['author.username'] = filtersParsed.author.username;
    }

    if (filtersParsed.author && filtersParsed.author.email) {
      query['author.email'] = filtersParsed.author.email;
    }

    if (filtersParsed.isRealMoney !== undefined) {
      query['isRealMoney'] = filtersParsed.isRealMoney;
    }

    if (filtersParsed.shopProduct && filtersParsed.shopProduct.categorieId) {
      query['shopProduct.categorieId'] = filtersParsed.shopProduct.categorieId;
    }

    if (filtersParsed.shopProductId){
      query['shopProductId'] = filtersParsed.shopProductId;
    }

    try {
      const skip = (pageNumber) * pageSize; // Calculer le nombre d'éléments à sauter
      const transactions = await this.transactionModel
        .find(query)
        .sort({ createdAt: -1 }) // Trier par ordre décroissant de la date de création
        .skip(skip)
        .limit(pageSize);

      const countTransactions = await this.transactionModel.countDocuments(query)

      return { list: transactions, total: countTransactions };
    } catch (error) {
      console.log(error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async getTransaction(transactionId:string){
    try {
      return await this.transactionModel.find({_id: transactionId});
    } catch (error) {
      console.log(error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  async changeStatusToClaimed2(transactionId: string){
    try {
      await this.transactionModel.findOneAndUpdate({ _id: transactionId }, { status: 'claimed2' })
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Status modifié avec succès'
      }
    } catch (error) {
      console.log(error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }
}
