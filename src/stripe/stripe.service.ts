import { HttpStatus, Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";

import Stripe from "stripe";
import { UserEntity } from "../users/entities/user.entity";
import * as process from "process";
import { TransactionsService } from "../transactions/transactions.service";
import { ShopService } from "../shop/shop.service";
import { InjectModel } from "@nestjs/mongoose";
import { McProfile, McProfileDocument } from "../users/schema/mcProfiles.schema";
import { Model } from "mongoose";


@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectModel(McProfile.name, "app-db") private mcProfileModel: Model<McProfileDocument>,
    private usersService: UsersService,
    private transactionService: TransactionsService,
    private shopService: ShopService
    ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY : 'error', {
      apiVersion: '2022-11-15'
    });
  }

  async getStripeProducts(){
    return this.stripe.products.list({limit: 100});
  }

  async getActiveStripePrices(){
    return this.stripe.prices.list({active: true, limit: 100});
  }

  async getStripePriceById(id: string){
    return this.stripe.prices.retrieve(id)
  }

  /**
   * This function generates a Stripe payment link for a given user and product.
   *
   * @param user - The user for whom the payment link is being generated.
   * @param productId - The ID of the product for which the payment link is being generated.
   *
   * @returns A promise that resolves to the URL of the generated Stripe payment link.
   *
   * @throws Will throw an error if the product ID is not found or if there is an issue with the Stripe API.
   */
  async getStripePaymentLink(user:UserEntity, productId: string) {
    // Retrieve the Stripe product ID associated with the given product ID
    const productStripeId = await this.shopService.getProduct(productId).then((product) => product.product.stripeLink)

    // Retrieve the default price of the Stripe product
    const productPrice = await this.stripe.products.retrieve(productStripeId).then((product) => product.default_price);

    // Generate a timestamp for the payment link
    const date = new Date().getTime().toString()

    // Create a new Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price: `${productPrice}`,
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.FRONT_CLIENT_URL}/shop/payment/successful?st=${user._id.toString().split('').reverse().join('')}${productId.split('').reverse().join('')}&pi=${productId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONT_CLIENT_URL}/shop/payment/cancel`,
      currency: "EUR",
      metadata: {
        userId: `${user._id}`,
        date: `${date}`
      }
    })

    // Return the URL of the generated Stripe payment link
    return session.url
  }

  /**
   * This function updates the Stripe payment status to 'confirmed' for a given user and product.
   * It checks the validity of the status and session ID, retrieves the user's MC profile,
   * retrieves the Stripe session, checks if the session ID is already used, retrieves the shop product,
   * retrieves the corresponding Stripe product, creates a transaction, and expires the session.
   *
   * @param user - The user for whom the payment status is being updated.
   * @param productId - The ID of the product for which the payment status is being updated.
   * @param body - The request body containing the status and session ID.
   * @body.status - The status to be checked.
   * @body.session_id - The Stripe session ID.
   *
   * @returns A promise that resolves to an object containing the HTTP status code and message.
   * @returns.statusCode - The HTTP status code.
   * @returns.message - The message indicating the success or failure of the operation.
   *
   * @throws Will throw an error if the status is not valid, the session ID is not valid,
   * the session ID is already used, or if the product cannot be found.
   */
  async updateStripePaymentStatusToSuccess(user: UserEntity, productId: string, body: { status: string, session_id: string}) {
    if ((user._id.toString().split('').reverse().join('') + productId.split('').reverse().join('')) == body.status){
      const mcProfile = await this.mcProfileModel.findOne({ user: user })
      const session = await this.stripe.checkout.sessions.retrieve(body.session_id);
      if(!session){
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Session Id not valid"
        }
      }
      if (await this.transactionService.existsSessionId(session.id)){
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Session already used"
        }
      }

      const shopProduct = await this.shopService.getProduct(productId).then((product) => product.product)
      const product = await this.stripe.products.retrieve(shopProduct.stripeLink)

      if (product) {
        await this.transactionService.createTransaction({
          author: user,
          status: 'confirmed',
          isRealMoney: true,
          cost: session.amount_total / 100,
          productName: product.name,
          mode: session.mode,
          session_id: session.id,
          shopProductId: productId,
          stripeProductId: shopProduct.stripeLink,
          shopProduct: shopProduct,
          mcProfile: mcProfile
        });
        //await this.stripe.checkout.sessions.expire(session.id);
        return {
          statusCode: HttpStatus.CREATED,
          message: "Stripe payment successfully updated to confirmed"
        }
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Can't find product"
        }
      }
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Status not valid"
      }
    }
  }
}
