import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api")
  app.useGlobalFilters({
  catch(exception: any, host: any) {
    console.error("PRISMA ERROR:", exception);
  }
});
  // ✅ ValidationPipe глобалдуу колдонуу
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // DTOда жок талааларды чыгарып салат
    forbidNonWhitelisted: true, // DTOда жок талаа болсо катасын чыгарат
    transform: true, // Авто-типтерди конверттейт
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
