export interface IDocuments {
    count: number
    next: any
    previous: any
    results: IDocumentResults[]
}

export interface IDocumentResults {
    uuid: string
    name: string
    document: string
    type: string
    created: string
    updated: string
}
