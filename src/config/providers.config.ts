import { ConfigService } from '@nestjs/config';
import { TypeOptions } from 'src/auth/provider/provider.constants';
import { GithubProvider } from 'src/auth/provider/services/github.provider';
import { GoogleProvider } from 'src/auth/provider/services/google.provider';

export const getProvidersConfig = async (
  configService: ConfigService,
): Promise<TypeOptions> => {

  const baseUrl = configService.getOrThrow('APPLICATION_URL');

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
