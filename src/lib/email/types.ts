export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export interface EmailSender {
  send(params: SendEmailParams): Promise<SendEmailResult>
}
