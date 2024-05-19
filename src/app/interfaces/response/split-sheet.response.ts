import { ICreateTracks } from "./create-tracks.response"

export interface ISplitSheetResult {
    track: ICreateTracks
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
