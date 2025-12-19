// import {
//   BadRequestException,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import type { TypeBaseProviderOptions } from './types/base-provider.options.types';
// import type { TypeUserInfo } from './types/user-info.types';

// @Injectable()
// export class BaseOAuthService {
//   private BASE_URL: string;

//   public constructor(private readonly options: TypeBaseProviderOptions) {}

//   protected async extraUserInfo(data: any): Promise<TypeUserInfo> {
//     return {
//       ...data,
//       provider: this.options.name,
//     };
//   }

//   public getOAuthUrl() {
//     const query = new URLSearchParams({
//       response_type: 'code',
//       client_id: this.options.client_id,
//       redirect_uri: this.getRedirectUrl(),
//       scope: (this.options.scopes ?? []).join(' '),
//       access_type: 'offline',
//       prompt: 'select_account',
//     });
//     return `${this.options.authorize_url}?${query}`;
//   }

//   public async findUserByCode(code: string): Promise<TypeUserInfo> {
//     const client_id = this.options.client_id;
//     const client_secret = this.options.client_secret;

//     const tokenQuery = new URLSearchParams({
//       client_id,
//       client_secret,
//       redirect_url: this.getRedirectUrl(),
//       grand_type: 'authorization_code',
//     });

//     const tokenRequest = await fetch(this.options.access_url, {
//       method: 'POST',
//       body: tokenQuery,
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         Accept: 'application/json',
//       },
//     });

//     const tokenResponse = await tokenRequest.json();

//     if (!tokenRequest.ok) {
//       throw new BadRequestException(
//         `Не удалось получить ползователя с ${this.options.profile_url}. Проверьте правилность токена доступа.`,
//       );
//     }
//     if (!tokenResponse.access_token) {
//       throw new BadRequestException(
//         `Нет токенов ${this.options.access_url}. Убедитесь что код авторизации действителен.`,
//       );
//     }
//     const userRequest = await fetch(this.options.profile_url, {
//       headers: {
//         Authorization: `Bearer ${tokenResponse.access_token}`,
//       },
//     });

//     if (!userRequest.ok) {
//       throw new UnauthorizedException(
//         `Не удалось получить пользователя с ${this.options.profile_url}. Проверьте правилность токена доступа.`,
//       );
//     }

//     const user = await userRequest.json()

//     const userData = await this.extraUserInfo(user)

//     return {
//         ...userData,
//         access_token: tokenResponse.access_token,
//         refresh_token: tokenResponse.refresh_token,
//         expires_at: tokenResponse.expires_at || tokenResponse.expires_in,
//         provider: this.options.name
//     }
//   }

//   public getRedirectUrl() {
//     return `${this.BASE_URL}/api/auth/oauth/callback/${this.options.name}`;
//   }

//   set baseUrl(value: string) {
//     this.BASE_URL = value;
//   }

//   get name() {
//     return this.options.name;
//   }

//   get access_url() {
//     return this.options.access_url;
//   }

//   get profile_url() {
//     return this.options.profile_url;
//   }

//   get scopes() {
//     return this.options.scopes;
//   }
// }

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { TypeBaseProviderOptions } from './types/base-provider.options.types';
import type { TypeUserInfo } from './types/user-info.types';

export abstract class BaseOAuthService {
  protected BASE_URL!: string;

  protected constructor(protected readonly options: TypeBaseProviderOptions) {}

  /** Авторизация URL (ар бир provider өзү ишке ашырат) */
  abstract getOAuthUrl(): string;

  /** code → user profile (ар бир provider өзү ишке ашырат) */
  abstract findUserByCode(code: string): Promise<TypeUserInfo>;

  protected getRedirectUrl(): string {
    return `${this.BASE_URL}/api/auth/oauth/callback/${this.options.name}`;
  }

protected normalizeUser(data: Partial<TypeUserInfo>): TypeUserInfo {
  if (!data.email) {
    throw new BadRequestException('Email not provided by OAuth provider');
  }

  if (!data.providerAccountId) {
    throw new BadRequestException('Provider account id not provided');
  }

  return {
    provider: this.options.name,
    providerAccountId: data.providerAccountId,
    email: data.email,
    name: data.name ?? '',
    picture: data.picture ?? '',
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };
}


  set baseUrl(value: string) {
    this.BASE_URL = value;
  }

  get name() {
    return this.options.name;
  }
}
