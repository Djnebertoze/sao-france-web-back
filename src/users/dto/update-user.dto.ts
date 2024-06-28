export class UpdateUserDto {
  readonly email?: string;
  readonly username?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phoneNumber?: string;
  readonly profilePicture?: string;
  readonly birthday?: string;
  readonly bio?: string;
  readonly showBirthday?: boolean;
  readonly acceptEmails?: boolean;
}
