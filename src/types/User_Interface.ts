export interface IUser {
    id?: string;
    fullName: string;
    email: string;
    password: string;
    dob?: string | null;
    phoneNumber?: number | null;
}