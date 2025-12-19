import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProviderService } from 'src/auth/provider/provider.service';


@Injectable()
export class AuthProviderGuard implements CanActivate {
  constructor(private readonly providerService: ProviderService) {}

  public canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const provider = request.params.provider;

    const providerIntance = this.providerService.findByService(provider);

    if (!providerIntance) {
      throw new NotFoundException(
        `Провайдер ${provider} не найден. Пожалуйста проверьте введенных данных.`,
      );
    }

    return true;
  }
}




