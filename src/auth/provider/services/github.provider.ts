// import { BaseOAuthService } from './base-oauth.serives';
// import { TypeProviderOptions } from './types/provider.options.types';
// import { TypeUserInfo } from './types/user-info.types';

// export class GithubProvider extends BaseOAuthService {
//   public constructor(options: TypeProviderOptions) {
//     super({
//       name: 'github',
//       authorize_url: 'https://github.com/login/oauth/authorize',
//       access_url: 'https://github.com/login/oauth/access_token',
//       profile_url: 'https://api.github.com/user',
//       scopes: options.scopes ?? ['user:email'],
//       client_id: options.client_id,
//       client_secret: options.client_secret,
//     });
//   }

//   public async extraUserInfo(
//     data: GithubApiProfile,
//   ): Promise<TypeUserInfo> {
//     return super.extraUserInfo({
//       email: data.email,
//       name: data.name ?? data.login,
//       picture: data.avatar_url,
//     });
//   }
// }

// export interface GithubApiProfile extends Record<string, any> {
//   id: number;
//   login: string;
//   node_id: string;

//   avatar_url: string;
//   html_url: string;

//   name: string | null;
//   email: string | null;

//   company?: string | null;
//   blog?: string | null;
//   location?: string | null;
//   bio?: string | null;

//   public_repos: number;
//   followers: number;
//   following: number;

//   created_at: string;
//   updated_at: string;

//   access_token: string;
// }

import { UnauthorizedException } from '@nestjs/common';
import { BaseOAuthService } from './base-oauth.serives';
import { TypeProviderOptions } from './types/provider.options.types';
import { TypeUserInfo } from './types/user-info.types';

export class GithubProvider extends BaseOAuthService {
  constructor(options: TypeProviderOptions) {
    super({
      name: 'github',
      authorize_url: 'https://github.com/login/oauth/authorize',
      access_url: 'https://github.com/login/oauth/access_token',
      profile_url: 'https://api.github.com/user',
      scopes: options.scopes ?? ['read:user', 'user:email'],
      client_id: options.client_id,
      client_secret: options.client_secret,
    });
  }

  getOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.options.client_id,
      redirect_uri: this.getRedirectUrl(),
      scope: this.options.scopes!.join(' '),
    });

    return `${this.options.authorize_url}?${params.toString()}`;
  }

  async findUserByCode(code: string): Promise<TypeUserInfo> {
    const tokenRes = await fetch(this.options.access_url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: this.options.client_id,
        client_secret: this.options.client_secret,
        code,
      }),
    });

    const token = await tokenRes.json();
    if (!token.access_token) {
      throw new UnauthorizedException('GitHub access token error');
    }

    const profileRes = await fetch(this.options.profile_url, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'User-Agent': 'NestJS-App',
      },
    });

    const profile = await profileRes.json();

    let email = profile.email;

    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'User-Agent': 'NestJS-App',
        },
      });

      const emails = await emailsRes.json();
      email = emails.find((e: any) => e.primary)?.email;
    }

    return this.normalizeUser({
      providerAccountId: String(profile.id),
      email,
      name: profile.name ?? profile.login,
      picture: profile.avatar_url,
      access_token: token.access_token,
    });
  }
}
