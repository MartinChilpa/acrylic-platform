export interface ISubscription {
    uuid: string
    created: string
    updated: string,
    billing_email: string,
    billing_details: string,
    country_code: string,
    phone: number,
    tax_id: string,
    failed_payment_notifications: boolean
}