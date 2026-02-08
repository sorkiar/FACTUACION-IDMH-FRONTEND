export interface ClientRequest {
    personTypeId: number
    documentTypeId: number
    documentNumber: string
    firstName: string
    lastName: string
    birthDate: string | null
    businessName: string
    contactPersonName: string
    phone1: string
    phone2: string
    email1: string
    email2: string
    address: string
}
