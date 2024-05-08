export interface ISplitSheet {
    count: number
    next: any
    previous: any
    results: ISplitSheetResult[]
}

export interface ISplitSheetResult {
    track: string
    track_name: string
    signed: any
    signature_request_id: string
    created: string
    updated: string
    publishing_splits: IPublishingSplit[]
    master_splits: IMasterSplit[]
}

export interface IPublishingSplit {
    uuid: string
    role: string
    name: string
    legal_name: string
    email: string
    percent: string
    signed: any
    pro_name: string
    ipi: any
}

export interface IMasterSplit {
    uuid: string
    role: string
    name: string
    legal_name: string
    email: string
    percent: string
    signed: any
}
