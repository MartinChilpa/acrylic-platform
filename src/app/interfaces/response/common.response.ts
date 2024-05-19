export interface ICommonResponse {
    detail: string;
}

export interface ICommonSuccessResponse<T> {
    count: number;
    next: any;
    previous: any;
    results: T;
}