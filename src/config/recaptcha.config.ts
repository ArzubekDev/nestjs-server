import { BadRequestException, Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class RecaptchaService {
  async verify(token: string) {
    if (!token) {
      throw new BadRequestException('Recaptcha token not provided')
    }

    const res = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
          response: token,
        },
      },
    )

    if (!res.data.success) {
      throw new BadRequestException('Bot detected')
    }
  }
}
