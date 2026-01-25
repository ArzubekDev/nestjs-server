import { TypeProviderOptions } from './../auth/provider/services/types/provider.options.types';
import { ConfigService } from '@nestjs/config';
import { options } from 'axios';
import { TypeOptions } from 'src/auth/provider/provider.constants';
import { GithubProvider } from 'src/auth/provider/services/github.provider';
import { GoogleProvider } from 'src/auth/provider/services/google.provider';

export const getProvidersConfig = async (
  configService: ConfigService,
): Promise<TypeOptions> => {
  const isProd = configService.get('NODE_ENV') === 'production';

  const baseUrl = isProd
    ? configService.getOrThrow<string>('APPLICATION_URL_PROD')
    : configService.getOrThrow<string>('APPLICATION_URL_DEV');

  const services = [
    new GoogleProvider({
      client_id: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      client_secret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      scopes: ['email', 'profile'],
    }),
    new GithubProvider({
      client_id: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      client_secret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      scopes: ['read:user', 'user:email'],
    }),
  ];

  // 🔥 ЭҢ МААНИЛҮҮ ЖЕР
  services.forEach((provider) => {
    provider.baseUrl = baseUrl;
  });

  return {
    baseUrl,
    services,
  };
};
