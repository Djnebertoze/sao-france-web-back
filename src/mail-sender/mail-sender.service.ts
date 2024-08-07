import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { SendMailDto } from "./dto/sendMailDto";
import { promisify } from "util";
import * as fs from "fs";
import { compile } from "handlebars";
import { resolve } from "path";
import { MailType } from "./mails/mailTypes.enum";


@Injectable()
export class MailSenderService {

  /**
 * This function sends an email using the provided data and mail type.
 * It reads the HTML template file, compiles it with the provided data, and sends the email using Nodemailer.
 *
 * @param sendMailDto - The DTO containing the email details (receiverEmail, subject, mailType).
 * @param data_to_insert - The data to be inserted into the HTML template.
 * @returns An object with the status and message of the email sending process.
 *
 * @throws Will throw an error if there is a problem reading the HTML template file or sending the email.
 */
async sendMail(sendMailDto: SendMailDto, data_to_insert:any) {
    const readFile = promisify(fs.readFile);

    let pathToFile;
    let data = {};

    // Switch statement to determine the email template and data based on the mailType
    switch (sendMailDto.mailType){

      case MailType.FIRST_REGISTER:
        pathToFile = '../../emails/user/registration.html'
        data = { action_url: `${process.env.FRONT_CLIENT_URL}/profile` }
        break;

      case MailType.PRODUCT_BUY:
        pathToFile = '../../emails/shop/product-buy.html'
        data = { action_url: `${process.env.FRONT_CLIENT_URL}/profile`}
        data = Object.assign({}, data, data_to_insert)
        break

      case MailType.RESET_PASSWORD:
        pathToFile = '../../emails/user/reset-password-request.html'
        data = Object.assign({}, data, data_to_insert)
        break
      case MailType.CHANGE_PASSWORD_SUCCESS:
        pathToFile = '../../emails/user/change-password-success.html'
        data = Object.assign({}, data, data_to_insert)
        break

      default:
        console.log('Imossible de trouver le mail: ', sendMailDto.mailType, ` ("${sendMailDto.subject}")`)
        return {
          status: 404,
          message: 'Email inexistant'
        }
    }

    // Read the HTML template file
    const htmlFile = await readFile(resolve(__dirname, pathToFile), 'utf8');
    const template = compile(htmlFile);
    const htmlToSend = template(data);

    try {
      // Create a transporter object using Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Define the email options
      const mailOptions = {
        from: '"SaoFranceMc" <contact@saofrance.net\n>', // sender address
        to: sendMailDto.receiverEmail, // list of receivers
        subject: sendMailDto.subject, // Subject line
        text: 'Hello world?', // plain text body
        html: htmlToSend, // html body
      };

      // Send the email
      await transporter.sendMail(mailOptions);
      return {
        status: 200,
        message: 'Email envoyé avec succès.'
      }
    } catch (error) {
      console.log(error)
      return {
        status: 400,
        message: 'Error'
      }
    }
  }
}
