import { ClientAddressResponse } from './client-address.response';

export interface ClientResponse {
    id: number
    personTypeId: number
    personType: string
    documentTypeId: number
    documentType: string
    documentNumber: string
    firstName: string
    lastName: string
    birthDate: string
    businessName: string
    contactPersonName: string
    countryCode1?: string
    phone1: string
    email1: string
    countryCode2?: string
    phone2?: string
    email2?: string
    retentionAgent?: boolean
    status: number
    addresses?: ClientAddressResponse[]
}
