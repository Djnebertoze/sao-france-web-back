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

  /**
   * Creates a new transaction.
   *
   * @param createTransactionDto - The data for creating a new transaction.
   * @param disableMails - Optional flag to disable sending mails.
   * @returns An object containing the HTTP status code and a message.
   */
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

  /**
   * Checks if a transaction session ID exists in the database.
   *
   * @param sessionId - The session ID to check for existence.
   * @returns A Promise that resolves to a boolean indicating whether the session ID exists.
   *          If an error occurs during the database operation, it resolves to an object with
   *          an HTTP status code and an error message.
   */
  async existsSessionId(sessionId: string) {
    try {
      // Attempt to find a transaction with the given session ID
      return await this.transactionModel.exists({session_id: sessionId})
    } catch (error) {
      // If an error occurs, return an object with the HTTP status code and error message
      return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.errors
        }
    }
  }

  /**
   * Retrieves confirmed transactions from the database.
   *
   * @returns A Promise that resolves to an array of confirmed transactions.
   *          Each transaction object contains the following properties:
   *          - status: The status of the transaction.
   *          - productName: The name of the product purchased.
   *          - shopProductId: The ID of the product in the shop.
   *          - shopProduct._id: The ID of the shop product.
   *          - mcProfile.name: The name of the Minecraft profile associated with the transaction.
   *          - mcProfile.uuid: The UUID of the Minecraft profile associated with the transaction.
   *          - shopProduct.name: The name of the shop product.
   *          - shopProduct.categorieId: The ID of the category of the shop product.
   *          - shopProduct.roleToGive: The role to be given to the Minecraft profile.
   *          - shopProduct.pointsToGive: The points to be given to the Minecraft profile.
   *          - shopProduct.cosmeticToGive: The cosmetic to be given to the Minecraft profile.
   *
   *          If an error occurs during the database operation, it resolves to an object with
   *          an HTTP status code and an error message.
   */
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

  /**
   * Changes the status of a transaction to 'claimed'.
   *
   * @param transactionId - The ID of the transaction to update.
   * @returns A Promise that resolves to an object containing the HTTP status code and a message.
   *          If the transaction is successfully updated, the status code will be HttpStatus.ACCEPTED,
   *          and the message will be 'Status modifié avec succès'.
   *          If an error occurs during the database operation, the status code will be HttpStatus.INTERNAL_SERVER_ERROR,
   *          and the message will contain the error details.
   */
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

  /**
   * Retrieves transactions of a specific user from the database.
   *
   * @param user - The user entity for which to retrieve transactions.
   * @returns A Promise that resolves to an array of transactions.
   *          If an error occurs during the database operation, it resolves to an object with
   *          an HTTP status code and an error message.
   *
   * @throws Will throw an error if the user parameter is not provided.
   */
  async getTransactionsOf(user:UserEntity){
    try {
      // Attempt to find transactions in the database where the author is the provided user
      return await this.transactionModel.find({ author: user });
    } catch (error) {
      // If an error occurs, return an object with the HTTP status code and error message
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.errors
      }
    }
  }

  /**
 * Retrieves all transactions from the database.
 *
 * @returns A Promise that resolves to an array of transactions sorted by creation date in descending order.
 *          If an error occurs during the database operation, it logs the error and returns an object with
 *          an HTTP status code and an error message.
 */
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

  /**
 * Retrieves a paginated list of transactions based on the provided filters.
 *
 * @param pageNumber - The page number to retrieve.
 * @param pageSize - The number of transactions per page.
 * @param filters - A JSON string containing the filters to apply.
 *
 * @returns A Promise that resolves to an object containing a list of transactions and the total count.
 *          The object has the following structure:
 *          {
 *            list: TransactionDocument[],
 *            total: number
 *          }
 *          If an error occurs during the database operation, it logs the error and returns an object with
 *          an HTTP status code and an error message.
 *
 * @throws Will throw an error if the filters parameter is not a valid JSON string.
 */
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

    const query = {};

    if (filtersParsed.author && filtersParsed.author.username) {
      query['author.username'] = filtersParsed.author.username;
    }

    if (filtersParsed.author && filtersParsed.author.email) {
      query['author.email'] = filtersParsed.author.email;
    }

    if (filtersParsed.isRealMoney!== undefined) {
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

  /**
 * Retrieves a transaction from the database by its ID.
 *
 * @param transactionId - The ID of the transaction to retrieve.
 * @returns A Promise that resolves to an array of transactions.
 *          If the transaction is found, the array will contain one element.
 *          If the transaction is not found, the array will be empty.
 *          If an error occurs during the database operation, it logs the error and returns an object with
 *          an HTTP status code and an error message.
 *
 * @throws Will throw an error if the transactionId parameter is not provided.
 */
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
