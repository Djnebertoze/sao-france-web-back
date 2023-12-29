import { MailType } from "../mails/mailTypes.enum";

export interface SendMailDto {
	receiverEmail: string;
	mailType: MailType;
	subject: string;
}
