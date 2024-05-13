export interface IAcrylicHome {
    count: number
    next: any
    previous: any
    results: IAcrylicHomeResult[]
}

export interface IAcrylicHomeResult {
    title: string
    image: string
    link_text: string
    url: string
    order: string
}