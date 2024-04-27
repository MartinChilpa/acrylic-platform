export interface IResetPasswordRequest {
    user_id: string;
    timestamp: number;
    signature: string;
    password: string;
}