import { HttpStatus, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { Transaction, TransactionDocument } from "./schema/transactions.schema";
import { InjectModel } from "@nestjs/mongoose";
import { UsersService } from "../users/users.service";
import { CreateTransactionDto } from "./dto/createTransactionDto";
import { ShopService } from "../shop/shop.service";
import { MailSenderService } from "../mail-sender/mail-sender.service";
import { MailType } from "../mail-sender/mails/mailTypes.enum";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name, 'app-db') private transactionModel: Model<TransactionDocument>,
    private usersService: UsersService,
    private shopService: ShopService,
    private mailSenderService: MailSenderService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto) {
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
        stripeProductId: createTransactionDto.stripeProductId ?? null
      });

      await this.shopService.collectProduct(createTransactionDto.shopProductId, createTransactionDto.author)

      const product_price_str = `${createTransactionDto.cost}${createTransactionDto.isRealMoney ? '€': ' PB'}`

      await this.mailSenderService.sendMail({
        receiverEmail: createTransactionDto.author.email,
        subject: `Merci pour votre achat '${createTransactionDto.productName}' x1 !`,
        mailType: MailType.PRODUCT_BUY
      }, {product_name: createTransactionDto.productName, product_price:product_price_str})

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
}
