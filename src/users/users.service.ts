import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schema/users.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from './entities/user.entity';
import { UserToken, UserTokenDocument } from './schema/usersTokens.schema';
import { CreateUserTokenDto } from './dto/create-userToken.dto';
import axios from "axios";
import { GetMicrosoftAccessTokenDto } from "./dto/get-microsoft-access-token.dto";
import { response } from "express";
import { SignatureTokens, SignatureTokensDocument } from "./schema/signatureTokens.schema";
import { McProfile, McProfileDocument } from "./schema/mcProfiles.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name, 'app-db') private userModel: Model<UserDocument>,
    @InjectModel(UserToken.name, 'app-db') private userTokenModel: Model<UserTokenDocument>,
    @InjectModel(SignatureTokens.name, 'app-db') private signatureTokensModel: Model<SignatureTokensDocument>,
    @InjectModel(McProfile.name, 'app-db') private mcProfileModel: Model<McProfileDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashed = await bcrypt.hash(createUserDto.password, 10);

    try {
      const newUser = await this.userModel.create({
        ...createUserDto,
        password: hashed,
      });

      if (newUser._id) {
        // TODO: Send confirmation email
      }
      return { registerSuccess: true };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  createUserToken(createUserTokenDto: CreateUserTokenDto) {
    try {
      return this.userTokenModel.create(createUserTokenDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll() {
    try {
      const users = await this.userModel.find({})
      const mcProfiles = await this.mcProfileModel.find({})
      return {users:users, mcProfiles:mcProfiles};
    } catch (error) {
      console.log(error)
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
      }
    }
  }

  async findOne(email: string) {
    try {
      return this.userModel.findOne({ email: email }, [
        'email',
        'firstName',
        'lastName',
        'roles',
        'profilePicture',
        'roles',
        'username',
        'shopPoints',
        'bio',
      ]);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOneByUsername(username: string) {
    try {
      return this.userModel.findOne({ username: username }, [
        'email',
        'firstName',
        'lastName',
        'roles',
        'profilePicture',
        'roles',
        'username',
        'shopPoints',
        'bio',
      ]);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOneAuth(email: string) {
    try {
      return this.userModel.findOne({ email: email }, [
        'email',
        'password',
        'username',
      ]);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOneUserToken(userId: string) {
    try {
      return this.userTokenModel.findOne({ userId: userId });
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserPrivateProfile(user: UserEntity) {
    try {
      const userProfile = await this.userModel.findOne({ _id: user._id }, [
        'firstName',
        'lastName',
        'email',
        'profilePicture',
        'phoneNumber',
        'createdAt',
        'roles',
        'username',
        'birthday',
        'shopPoints',
        'bio',
      ]);

      const mcProfile = await this.mcProfileModel.findOne({user: user._id}, [
        'name',
        'skinUrl',
        'skinVariant',
        'uuid'
      ])

      const combinedResponse = {
        user: userProfile,
        mcProfile: mcProfile
      }

      return combinedResponse;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserPublicProfile(id: string) {
    try {
      const userProfile = await this.userModel.findOne({ _id: id }, [
        'firstName',
        'profilePicture',
        'createdAt',
        'username',
        'roles',
        'bio',
      ]);

      const mcProfile = await this.mcProfileModel.findOne({user: id}, [
        'name',
        'skinUrl',
        'skinVariant'
      ])

      const combinedResponse = {
        user: userProfile,
        mcProfile: mcProfile
      }

      return combinedResponse;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(user: UserEntity, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        await this.removeUserTokenByUserId(user._id);
      }

      return this.userModel
        .findOneAndUpdate({ _id: user._id }, updateUserDto, {
          returnOriginal: false,
        })
        .select(
          '_id username firstName lastName email phoneNumber profilePicture createdAt birthday roles bio',
        );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updatePassword(token: string, updatePasswordDto: { password: string }) {
    try {
      const payload = jwt.verify(token, process.env.PASSWORD_RESET_SECRET) as {
        email: string;
      };
      const hashed = await bcrypt.hash(updatePasswordDto.password, 10);
      return this.userModel.updateOne(
        { email: payload.email },
        { password: hashed },
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async addShopPoints(user: UserEntity, shopPoints: number) {
    try {

      return await this.userModel.updateOne(
        { _id: user._id },
        { shopPoints: user.shopPoints + shopPoints },
        { returnOriginal: false }
      );
    } catch (error) {
      console.log('error', error)
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad request',
        }
    }
  }

  async removeShopPoints(user: UserEntity, shopPoints: number) {
    try {
      return await this.userModel.updateOne(
        { _id: user._id },
        { shopPoints: user.shopPoints - shopPoints },
        { returnOriginal: false }
      );
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
      }
    }
  }

  async addRole(user: UserEntity, roleId: string) {
    try {
      return await this.userModel.updateOne(
        { _id: user._id },
        { roles: [ ...user.roles, roleId ] },
        { returnOriginal: false }
      );
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
      }
    }
  }

  async removeRole(user: UserEntity, roleId: string) {
    try {
      return await this.userModel.updateOne(
        { _id: user._id },
        { roles: user.roles.filter(role => role !== roleId) },
        { returnOriginal: false }
      );
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
      }
    }
  }

  async remove(user: UserEntity, email: string) {
    try {
      if (user.email === email) {
        return this.userModel.deleteOne({ email: email });
      } else {
        throw new ForbiddenException();
      }
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async removeUserToken(userToken: UserToken) {
    try {
      return await this.userTokenModel.deleteOne({ _id: userToken });
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async removeUserTokenByUserId(userId: string) {
    try {
      return this.userTokenModel.deleteOne({ userId: userId });
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserByEmail(email: string) {
    try {
      return this.userModel
        .findOne({ email: email })
        .select(
          '_id username firstName lastName email phoneNumber profilePicture createdAt roles birthday shopPoints bio',
        );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async requestXboxServices(user: UserEntity, request: Request) {
    //console.log("request")

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const access_token = request.body.access_token;

    let mc_access_token;
    let xbox_live_token;
    let xsts_token;
    let xsts_response;


      const STANDARD_HEADERS = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }

    const foundToken = await this.signatureTokensModel.findOne({
      user: user._id,
      type: "minecraft_access_token",
      expiresAt: { $gt: new Date().getTime() }, // Vérifiez si expiresAt est supérieur à la date actuelle
    });





      /*##########################
          Request to XBOX Services
        ##########################*/


      //console.log("REQUEST TO XBOX SERVICES")

      const BASE_URL = "https://user.auth.xboxlive.com/user/authenticate";
      try {
        if (!foundToken) {
          const response = await axios.post(
            BASE_URL, {
              Properties: {
                AuthMethod: 'RPS',
                SiteName: 'user.auth.xboxlive.com',
                RpsTicket: `d=${access_token}`
              },
              RelyingParty: 'http://auth.xboxlive.com',
              TokenType: 'JWT'
            },
            {
              headers: STANDARD_HEADERS,
              responseType: 'json'
            }
          );
          //console.log("RESPONSE 1", response.data)

          xbox_live_token = response.data.Token;

        }

        /*##########################
           Request to XSTS Services
          ##########################*/


        //console.log("REQUEST TO XBOX XSTS TOKEN")

        const XSTS_BASE_URL = "https://xsts.auth.xboxlive.com/xsts/authorize";
        try {
          if(!foundToken) {
            xsts_response = await axios.post(
              XSTS_BASE_URL, {
                Properties: {
                  SandboxId: 'RETAIL',
                  UserTokens: [xbox_live_token]
                },
                RelyingParty: 'rp://api.minecraftservices.com/',
                TokenType: 'JWT'
              },
              {
                headers: STANDARD_HEADERS,
                responseType: 'json'
              }
            );
            //console.log("XSTS RESPONSE", xsts_response.data)
            //console.log("xui", xsts_response.data.DisplayClaims.xui[0])

            xsts_token = xsts_response.data.Token

          }

          /*##############################
              Request to MC Auth Services
            ##############################*/

          //console.log("REQUEST TO MC AUTH")

          const MC_AUTH_BASE_URL = "https://api.minecraftservices.com/authentication/login_with_xbox";
          try {
            if(!foundToken) {
              const mc_auth_response = await axios.post(
                MC_AUTH_BASE_URL, {
                  identityToken: `XBL3.0 x=${xsts_response.data.DisplayClaims.xui[0].uhs};${xsts_token}`
                },
                {
                  headers: STANDARD_HEADERS,
                  responseType: 'json'
                }
              );
              //console.log("MC AUTH RESPONSE", mc_auth_response.data)

              const expires_in = mc_auth_response.data.expires_in
              mc_access_token = mc_auth_response.data.access_token;

              const oldTokens = await this.signatureTokensModel.deleteMany({
                user: user._id,
                type: "minecraft_access_token"
              });



              const newSignature = this.signatureTokensModel.create({
                type: "minecraft_access_token",
                token: mc_access_token,
                issuedAt: new Date().getTime(),
                expiresAt: new Date().getTime() + expires_in,
                user: user
              })


            }



            if (foundToken){
              mc_access_token = foundToken.token;
              //console.log("TOKEN RECUPERE")
            }

          /*##############################
              Request to MC to check game ownership
            ##############################*/

          const MC_CHECK_BASE_URL = "https://api.minecraftservices.com/entitlements/mcstore";
          try {
            const mc_check_response = await axios.get(
              MC_CHECK_BASE_URL, {
                headers: {
                  Authorization: "Bearer " + mc_access_token
                }
              }
            );
            //console.log("MC check RESPONSE", mc_check_response.data)

            // If mc_check_response.data.items is empty the user don't have Minecraft, if not, he own.

            if(mc_check_response.data.items.toString() === ""){
              //console.log("Dont have Minecraft")
              return JSON.parse('{"hasMinecraft": false}');
            } else {
              //console.log("Have Minecraft")

              const MC_GET_PROFILE_BASE_URL = "https://api.minecraftservices.com/minecraft/profile"
              const mc_get_profile_response = await axios.get(
                MC_GET_PROFILE_BASE_URL, {
                  headers: {
                    Authorization: "Bearer " + mc_access_token
                  }
                }
              );

              const mc_data_profile = mc_get_profile_response.data;

              const activeSkin = mc_data_profile.skins.find(skin => skin.state === "ACTIVE");


              const oldAccounts = await this.mcProfileModel.deleteMany({
                user: user._id
              })

              if(activeSkin){
                const newMcProfile = this.mcProfileModel.create({
                  name: mc_data_profile.name,
                  uuid: mc_data_profile.id,
                  skinUrl: activeSkin.url,
                  skinVariant: activeSkin.variant,
                  user: user
                })
              } else {
                const newMcProfile = this.mcProfileModel.create({
                  name: mc_data_profile.name,
                  uuid: mc_data_profile.id,
                  user: user
                })
              }

              const combinedResponse = {
                hasMinecraft: true,
                profile: mc_data_profile,
              };


              return combinedResponse;
            }


          } catch (error: any) {
            console.log(error.message)
            console.log(error)
          }


        } catch (error: any) {
          console.log(error.message)
          console.log(error)
        }


      } catch (error: any) {
        console.log(error)
      }

    } catch (error: any) {
      console.log(error)
    }

  }

  /*async uploadProfilePicture(file: Express.Multer.File, user: UserEntity) {
    const fileName = await this.awsS3Service.uploadImage(file, 'profile-pictures/');
    if (!user.profilePicture.includes('default-profile-picture')) {
      await this.awsS3Service.deleteImage(user.profilePicture.split('amazonaws.com/')[1]);
    }
    return this.update(user, {
      profilePicture: process.env.AWS_S3_BUCKET_URL + '/profile-pictures/' + fileName,
    });
  }*/
}
