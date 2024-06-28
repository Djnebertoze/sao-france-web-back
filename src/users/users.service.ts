import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, UserDocument } from "./schema/users.schema";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { UserEntity } from "./entities/user.entity";
import { UserToken, UserTokenDocument } from "./schema/usersTokens.schema";
import { CreateUserTokenDto } from "./dto/create-userToken.dto";
import axios from "axios";
import { SignatureTokens, SignatureTokensDocument } from "./schema/signatureTokens.schema";
import { McProfile, McProfileDocument } from "./schema/mcProfiles.schema";
import { JwtService } from "@nestjs/jwt";
import { MailSenderService } from "../mail-sender/mail-sender.service";
import { MailType } from "../mail-sender/mails/mailTypes.enum";
import * as process from "process";
import { TransactionsService } from "../transactions/transactions.service";


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name, "app-db") private userModel: Model<UserDocument>,
    @InjectModel(UserToken.name, "app-db") private userTokenModel: Model<UserTokenDocument>,
    @InjectModel(SignatureTokens.name, "app-db") private signatureTokensModel: Model<SignatureTokensDocument>,
    @InjectModel(McProfile.name, "app-db") private mcProfileModel: Model<McProfileDocument>,

    private jwtService: JwtService,
    private mailSenderService: MailSenderService
  ) { }

  async create(createUserDto: CreateUserDto) {
    const hashed = await bcrypt.hash(createUserDto.password, 10);

    try {
      if (await this.userModel.exists({ email: createUserDto.email })) {
        return {
          status: 400,
          message: "Email déjà utilisée !"
        };
      } else if (await this.userModel.exists({ username: createUserDto.username })) {
        return {
          status: 400,
          message: "Nom d'utilisateur déjà utilisé !"
        };
      } else {
        const newUser = await this.userModel.create({
          ...createUserDto,
          password: hashed
        });

        if (newUser._id) {


          const payload = { _id: newUser._id, email: newUser.email };

          const newAccessToken = this.jwtService.sign(payload);
          const tokenInfos = this.jwtService.verify(newAccessToken);

          await this.mailSenderService.sendMail({
            receiverEmail: newUser.email,
            subject: "Bienvenu(e) chez SaoFranceMc !",
            mailType: MailType.FIRST_REGISTER
          }, {});

          return this.createUserToken({
            accessToken: newAccessToken,
            issuedAt: tokenInfos.iat,
            expiresAt: tokenInfos.exp,
            userId: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName
          });
        } else {
          await this.userModel.deleteOne({ username: createUserDto.username });
          return {
            message: "Problème interne lors de la cration de votre compte."
          };
        }
      }
    } catch (error) {
      console.log(error);
      try {
        await this.userModel.deleteOne({ username: createUserDto.username });
      } catch (error) {
      }
      return {
        message: "Problème interne lors de la cration de votre compte."
      };
    }
  }

  createUserToken(createUserTokenDto: CreateUserTokenDto) {
    try {
      return this.userTokenModel.create(createUserTokenDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async findAll() {
    try {
      const users = await this.userModel.find({});
      const mcProfiles = await this.mcProfileModel.find({});
      return { users: users, mcProfiles: mcProfiles };
    } catch (error) {
      console.log(error);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Bad Request"
      };
    }
  }

  async findOne(email: string) {
    try {
      return this.userModel.findOne({ email: email }, [
        "email",
        "firstName",
        "lastName",
        "roles",
        "profilePicture",
        "roles",
        "username",
        "shopPoints",
        "bio"
      ]);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async findOneByUsername(username: string) {
    try {
      return this.userModel.findOne({ username: username }, [
        "email",
        "firstName",
        "lastName",
        "roles",
        "profilePicture",
        "roles",
        "username",
        "shopPoints",
        "bio"
      ]);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async findOneAuth(email: string) {
    try {
      return this.userModel.findOne({ email: email }, [
        "email",
        "password",
        "username"
      ]);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
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
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getUserPrivateProfile(userId: string) {
    try {
      const userProfile = await this.userModel.findOne({ _id: userId }, [
        "firstName",
        "lastName",
        "email",
        "profilePicture",
        "phoneNumber",
        "createdAt",
        "roles",
        "username",
        "birthday",
        "showBirthday",
        "shopPoints",
        "bio",
        'acceptEmails'
      ]);

      const mcProfile = await this.mcProfileModel.findOne({ user: userId }, [
        "name",
        "skinUrl",
        "skinVariant",
        "uuid"
      ]);

      return {
        status: HttpStatus.OK,
        user: userProfile,
        mcProfile: mcProfile
      };
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erreur interne. Veuillez réessayer ultérieurement.'
      }
    }
  }

  async getUserPublicProfile(id: string) {
    try {
      const userProfile = await this.userModel.findOne({ _id: id }, [
        "firstName",
        "profilePicture",
        "createdAt",
        "username",
        "roles",
        "bio",
        "showBirthday",
        "birthday"
      ]);

      const mcProfile = await this.mcProfileModel.findOne({ user: id }, [
        "name",
        "skinUrl",
        "skinVariant"
      ]);
      return {
        user: userProfile,
        mcProfile: mcProfile
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async update(user: UserEntity, updateUserDto: UpdateUserDto) {
    try {

      if (user.username != updateUserDto.username && await this.userModel.exists({ username: updateUserDto.username })) {
        return {
          status: 400,
          message: "Nom d'utilisateur déjà utilisé."
        };
      }
      if (user.email != updateUserDto.email && await this.userModel.exists({ email: updateUserDto.email })) {
        return {
          status: 400,
          message: "Email déjà utilisée."
        };
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        await this.removeUserTokenByUserId(user._id);
      }

      return this.userModel
        .findOneAndUpdate({ _id: user._id }, updateUserDto, {
          returnOriginal: false
        })
        .select(
          "_id username firstName lastName email phoneNumber profilePicture createdAt birthday roles bio"
        );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad request"
        },
        HttpStatus.BAD_REQUEST
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
        { password: hashed }
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async addShopPoints(user: UserEntity, shopPoints: number) {
    try {

      return this.userModel.updateOne(
        { _id: user._id },
        { shopPoints: Number(user.shopPoints) + Number(shopPoints) },
        { returnOriginal: false }
      );
    } catch (error) {
      console.log("error", error);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Bad request"
      };
    }
  }

  async removeShopPoints(user: UserEntity, shopPoints: number) {
    console.log('removing ' + shopPoints + "sp")
    try {
      await this.userModel.updateOne(
        { _id: user._id },
        { shopPoints: Number(user.shopPoints) - Number(shopPoints) },
        { returnOriginal: false }
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async addRole(user: UserEntity, roleId: string) {
    try {

      if (user.roles.join(",").includes(roleId)) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Rôle déjà possédé.'
        };
      }

      await this.userModel.updateOne(
        { _id: user._id },
        { roles: [...user.roles, roleId] },
        { returnOriginal: false }
      );
      return {
        status: HttpStatus.OK,
        message: 'Success.'
      };
    } catch (error) {
      console.log(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erreur interne. Veuillez réessayer ultérieurement.'
      };
    }
  }

  async removeRole(user: UserEntity, roleId: string) {
    try {
      await this.userModel.updateOne(
        { _id: user._id },
        { roles: user.roles.filter(role => role !== roleId) },
        { returnOriginal: false }
      );
      console.log('remove role to ', user.username, ' : ', roleId)
      return {
        status: HttpStatus.OK,
        message: 'Success.'
      };
    } catch (error) {
      console.log(error)
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erreur interne. Veuillez réessayer ultérieurement.'
      };
    }
  }

  async remove(user: UserEntity, email: string) {
    try {
      if (user.email === email) {
        return this.userModel.deleteOne({ email: email });
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        error: error
      };
    }
  }

  async removeUserToken(userToken: UserToken) {
    try {
      return await this.userTokenModel.deleteOne({ _id: userToken });
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
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
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getUserByEmail(email: string) {
    try {
      return this.userModel
        .findOne({ email: email })
        .select(
          "_id username firstName lastName email phoneNumber profilePicture createdAt roles birthday shopPoints bio"
        );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getUserById(id: string) {
    try {
      return this.userModel
        .findOne({ _id: id })
        .select(
          "_id username firstName lastName email phoneNumber profilePicture createdAt roles birthday shopPoints bio"
        );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Bad Request"
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async sendPasswordReset(email: string) {
    try {
      const user = await this.userModel.findOne({ email: email });

      if (!user) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Utilisateur introuvable"
        };
      }

      const emailToken = jwt.sign({ email: email }, process.env.PASSWORD_RESET_JWT_SECRET, {
        expiresIn: process.env.PASSWORD_RESET_JWT_EXPIRATION
      });

      const resetUrl = process.env.FRONT_CLIENT_URL + "/profile/reset-password?token=" + emailToken;

      await this.mailSenderService.sendMail({
        receiverEmail: email,
        subject: "Réinitialisation de votre mot de passe",
        mailType: MailType.RESET_PASSWORD
      }, { reset_url: resetUrl });

      return {
        status: HttpStatus.OK,
        message: "Email envoyé avec succès."
      };
    } catch (error) {
      console.log(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur interne. Veuillez réessayer ultérieurement."
      };
    }
  }

  async resetPassword(token: string, body: { password: string }) {
    try {
      const payload = jwt.verify(token, process.env.PASSWORD_RESET_JWT_SECRET) as { email: string };
      await this.userModel.updateOne(
        { email: payload.email },
        { password: await bcrypt.hash(body.password, 10) }
      );

      await this.mailSenderService.sendMail({
        receiverEmail: payload.email,
        subject: "Mot de passe changé",
        mailType: MailType.CHANGE_PASSWORD_SUCCESS
      }, {});

      return { status:HttpStatus.OK, message: "success" };
    } catch (error) {
      console.log(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur interne. Veuillez réessayer ultérieurement."
      };
    }
  }

  async requestXboxServices(user: UserEntity, request: Request) {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const access_token = request.body.access_token;

    let mc_access_token;
    let xbox_live_token;
    let xsts_token;
    let xsts_response;


    const STANDARD_HEADERS = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    const foundToken = await this.signatureTokensModel.findOne({
      user: user._id,
      type: "minecraft_access_token",
      expiresAt: { $gt: new Date().getTime() } // Vérifiez si expiresAt est supérieur à la date actuelle
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
              AuthMethod: "RPS",
              SiteName: "user.auth.xboxlive.com",
              RpsTicket: `d=${access_token}`
            },
            RelyingParty: "http://auth.xboxlive.com",
            TokenType: "JWT"
          },
          {
            headers: STANDARD_HEADERS,
            responseType: "json"
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
        if (!foundToken) {
          xsts_response = await axios.post(
            XSTS_BASE_URL, {
              Properties: {
                SandboxId: "RETAIL",
                UserTokens: [xbox_live_token]
              },
              RelyingParty: "rp://api.minecraftservices.com/",
              TokenType: "JWT"
            },
            {
              headers: STANDARD_HEADERS,
              responseType: "json"
            }
          );
          //console.log("XSTS RESPONSE", xsts_response.data)
          //console.log("xui", xsts_response.data.DisplayClaims.xui[0])

          xsts_token = xsts_response.data.Token;

        }

        /*##############################
            Request to MC Auth Services
          ##############################*/

        //console.log("REQUEST TO MC AUTH")

        const MC_AUTH_BASE_URL = "https://api.minecraftservices.com/authentication/login_with_xbox";
        try {
          if (!foundToken) {
            const mc_auth_response = await axios.post(
              MC_AUTH_BASE_URL, {
                identityToken: `XBL3.0 x=${xsts_response.data.DisplayClaims.xui[0].uhs};${xsts_token}`
              },
              {
                headers: STANDARD_HEADERS,
                responseType: "json"
              }
            );
            //console.log("MC AUTH RESPONSE", mc_auth_response.data)

            const expires_in = mc_auth_response.data.expires_in;
            mc_access_token = mc_auth_response.data.access_token;
            await this.signatureTokensModel.deleteMany({
              user: user._id,
              type: "minecraft_access_token"
            });
            await this.signatureTokensModel.create({
              type: "minecraft_access_token",
              token: mc_access_token,
              issuedAt: new Date().getTime(),
              expiresAt: new Date().getTime() + expires_in,
              user: user
            });
          }


          if (foundToken) {
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

            if (mc_check_response.data.items.toString() === "") {
              //console.log("Dont have Minecraft")
              return JSON.parse("{\"hasMinecraft\": false}");
            } else {
              //console.log("Have Minecraft")

              const MC_GET_PROFILE_BASE_URL = "https://api.minecraftservices.com/minecraft/profile";
              const mc_get_profile_response = await axios.get(
                MC_GET_PROFILE_BASE_URL, {
                  headers: {
                    Authorization: "Bearer " + mc_access_token
                  }
                }
              );

              const mc_data_profile = mc_get_profile_response.data;

              const activeSkin = mc_data_profile.skins.find(skin => skin.state === "ACTIVE");
              await this.mcProfileModel.deleteMany({
                user: user._id
              });
              if (activeSkin) {
                await this.mcProfileModel.create({
                  name: mc_data_profile.name,
                  uuid: mc_data_profile.id,
                  skinUrl: activeSkin.url,
                  skinVariant: activeSkin.variant,
                  user: user
                });
              } else {
                await this.mcProfileModel.create({
                  name: mc_data_profile.name,
                  uuid: mc_data_profile.id,
                  user: user
                });
              }

              return {
                hasMinecraft: true,
                profile: mc_data_profile
              };
            }


          } catch (error: any) {
            console.log(error.message);
            console.log(error);
          }


        } catch (error: any) {
          console.log(error.message);
          console.log(error);
        }


      } catch (error: any) {
        console.log(error);
      }

    } catch (error: any) {
      console.log(error);
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
