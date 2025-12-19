// import { BaseOAuthService } from './base-oauth.serives';
// import { TypeProviderOptions } from './types/provider.options.types';
// import { TypeUserInfo } from './types/user-info.types';

// export class GoogleProvider extends BaseOAuthService {
//   public constructor(options: TypeProviderOptions) {
//     super({
//       name: 'google',
//       authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
//       access_url: 'https://oauth2.googleapis.com/token',
//       profile_url: 'https://www.googleapis.com/oauth2/v3/userinfo',
//       scopes: options.scopes,
//       client_id: options.client_id,
//       client_secret: options.client_secret,
//     });
//   }

//   public async extraUserInfo(data: GoogleProfile): Promise<TypeUserInfo> {
//       return super.extraUserInfo({
//         email: data.email,
//         name: data.name,
//         picture: data.picture
//       })
//   }
// }

// interface GoogleProfile extends Record<string, any> {
//   aud: string;
//   azp: string;
//   email: string;
//   email_verified: boolean;
//   exp: number;
//   family_name?: string;
//   given_name: string;
//   hg?: string;
//   iat: number;
//   iss: string;
//   jti?: string;
//   locale?: string;
//   name: string;
//   nbf?: string;
//   picture: string;
//   sub: string;
//   access_token: string;
//   refresh_token?: string;
// }

import { UnauthorizedException } from '@nestjs/common';
import { BaseOAuthService } from './base-oauth.serives';
import { TypeProviderOptions } from './types/provider.options.types';
import { TypeUserInfo } from './types/user-info.types';

export class GoogleProvider extends BaseOAuthService {
  constructor(options: TypeProviderOptions) {
    super({
      name: 'google',
      authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      access_url: 'https://oauth2.googleapis.com/token',
      profile_url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      scopes: options.scopes ?? ['email', 'profile'],
      client_id: options.client_id,
      client_secret: options.client_secret,
    });
  }

  getOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.options.client_id,
      redirect_uri: this.getRedirectUrl(),
      response_type: 'code',
      scope: this.options.scopes!.join(' '),
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `${this.options.authorize_url}?${params.toString()}`;
  }

  async findUserByCode(code: string): Promise<TypeUserInfo> {
    const tokenRes = await fetch(this.options.access_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.options.client_id,
        client_secret: this.options.client_secret,
        code,
        redirect_uri: this.getRedirectUrl(),
        grant_type: 'authorization_code',
      }),
    });

    const token = await tokenRes.json();
    if (!token.access_token) {
      throw new UnauthorizedException('Google access token error');
    }

    const profileRes = await fetch(this.options.profile_url, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    const profile = await profileRes.json();

    return this.normalizeUser({
      providerAccountId: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_in,
    });
  }
}
