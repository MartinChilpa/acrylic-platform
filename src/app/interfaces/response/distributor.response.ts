export interface IDistributors {
    count: number
    next: any
    previous: any
    results: IDistributorsResult[]
}

export interface IDistributorsResult {
    uuid: string | null;
    name: string;
}
