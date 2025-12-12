import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api")
  app.useGlobalFilters({
  catch(exception: any, host: any) {
    console.error("PRISMA ERROR:", exception);
  }
});

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
