import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from "@nestjs/schedule";
import { UsersService } from "./users/users.service";
import { JwtService } from "@nestjs/jwt";
import { StripeService } from "./stripe/stripe.service";
import { ShopService } from "./shop/shop.service";
import { ShopProductDto } from "./shop/dto/shopProductDto";

@Injectable()
export class AppService {

  constructor(
    private stripeService: StripeService,
    private shopService: ShopService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async updateStripePrices() {
    const stripePrices = await this.stripeService.getActiveStripePrices();
    const stripeProducts = await this.stripeService.getStripeProducts();
    const shopProducts = await this.shopService.getProducts();

    shopProducts.products.map((shopProduct) => {
      if (shopProduct.isRealMoney && shopProduct.stripeLink){
        const stripePrice = stripePrices.data.filter((stripePrice) => stripePrice.id === stripeProducts.data.filter((stripeProduct) => stripeProduct.id === shopProduct.stripeLink)[0]?.default_price)[0]?.unit_amount / 100;
        if (stripePrice && stripePrice != shopProduct.price){
          const shopProductId = shopProduct._id.toString().match(/[^"]*/i)[0]
          this.shopService.editShopProduct(shopProductId, {
            name: shopProduct.name,
            description: shopProduct.description,
            price: stripePrice,
            isRealMoney: shopProduct.isRealMoney,
            imageUrl: shopProduct.imageUrl,
            categorieId: shopProduct.categorieId,
            stripeLink: shopProduct.stripeLink,
            descriptionDetails: shopProduct.descriptionDetails,
            pointsToGive: shopProduct.pointsToGive,
            roleToGive: shopProduct.roleToGive
          })
        }
      }
    })
  }
}
