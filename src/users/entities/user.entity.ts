export class UserEntity {
  _id?: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  profilePicture: string;
  phoneNumber?: string;
  birthday?: string;
  showBirthday: boolean;
  shopPoints: number;
  acceptEmails: boolean;
  bio?: string;
}
