import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "../users/schema/users.schema";
import { Model } from "mongoose";
import { Transaction, TransactionDocument } from "../transactions/schema/transactions.schema";
import { McProfile, McProfileDocument } from "../users/schema/mcProfiles.schema";

@Injectable(

)
export class StatisticsService {

  constructor(
    @InjectModel(User.name, "app-db") private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name, 'app-db') private transactionModel: Model<TransactionDocument>,
    @InjectModel(McProfile.name, "app-db") private mcProfileModel: Model<McProfileDocument>,
    ) {}

  async getAdminStats(){
    const today = new Date();
    const priorDate60 = new Date(new Date(new Date().setDate(today.getDate() - 60)).setHours(0,0,0));


    // Get 60d registers stats
    const registers60dData = {}
    for (let i = 60; i >= 0; i--) {
      const priorDate = new Date(new Date().setDate(today.getDate() - i));
      const startOfDay = new Date(priorDate.getFullYear(), priorDate.getMonth(), priorDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(priorDate.getFullYear(), priorDate.getMonth(), priorDate.getDate(), 23, 59, 59);

      registers60dData[''+priorDate.getDate() + '/' + (priorDate.getMonth() + 1)] = await this.userModel.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
    }

    // Amount of users
    const amountOfUsers = await this.userModel.countDocuments({});

    // Amount of new users in 60d
    const amountOfNewUsers60d = await this.userModel.countDocuments({
      createdAt: {
        $gte: priorDate60,
        $lte: today
      }
    });

    // Get 60d transactions stats (more than 0€ or 0PB)
    const transactions60dData = {}
    for (let i = 60; i >= 0; i--) {
      const priorDate = new Date(new Date().setDate(today.getDate() - i));
      const startOfDay = new Date(priorDate.getFullYear(), priorDate.getMonth(), priorDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(priorDate.getFullYear(), priorDate.getMonth(), priorDate.getDate(), 23, 59, 59);

      transactions60dData[''+priorDate.getDate() + '/' + (priorDate.getMonth() + 1)] = await this.transactionModel.count({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        cost: {
          $gt: 0
        }
      })
    }

    // Get types of transactions last 60d
    const typesTransactions60dData = {}
    typesTransactions60dData['grades'] = await this.transactionModel.countDocuments(
      {
        'shopProduct.categorieId': 'grades',
        cost: {
          $gt: 0
        }
      }
    )
    typesTransactions60dData['points'] = await this.transactionModel.countDocuments(
      {
        'shopProduct.categorieId': 'points',
        cost: {
          $gt: 0
        }
      }
    )
    typesTransactions60dData['cosmetiques'] = await this.transactionModel.countDocuments(
      {
        'shopProduct.categorieId': 'cosmetiques',
        cost: {
          $gt: 0
        }
      }
    )

    // Count revenues
    const transactions60d = await this.transactionModel.find({
      cost: {
        $gt: 0
      },
      createdAt: {
        $gte: priorDate60,
        $lte: today
      }
    })

    let revenuesEuroLast60d = 0;
    let shopPointsUsed = 0;
    for (const transaction of transactions60d) {
      if (transaction.isRealMoney){
        revenuesEuroLast60d += transaction.cost;
      } else {
        shopPointsUsed += transaction.cost;
      }
    }

    return {
      registers: {
        data: registers60dData
      },
      transactions: {
        data: transactions60dData,
        types: {
          data: typesTransactions60dData
        },
        revenues: revenuesEuroLast60d,
        shopPointsUsed: shopPointsUsed
      },
      numbers: {
        users: amountOfUsers,
        newUsers60d: amountOfNewUsers60d
      }
    };
  }

}
