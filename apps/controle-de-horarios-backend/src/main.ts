import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

process.env.TZ = 'America/Sao_Paulo';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://10.10.100.176:3000',
      'http://10.10.100.176:3005',
      'http://localhost:3005',
      'https://horarios.vpioneira.com.br',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3005',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    credentials: true,
  });

  // Configurar prefixo global
  app.setGlobalPrefix('api');

  // Configurar pipes de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        console.error('[VALIDATION] Erro de validação:', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Controle de Horários API')
    .setDescription('API para controle de horários de funcionários')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  //const port = process.env.PORT || 3355; // Docker
  const port = process.env.PORT || 3336; // Desenvolvimento
  //const port = process.env.PORT || 3335; // Produção
  await app.listen(port);

  console.log('==========================================');
  console.log('CONTROLE DE HORÁRIOS - BACKEND INICIADO');
  console.log('==========================================');
  console.log(`[INFO] Servidor: http://localhost:${port}`);
  console.log(`[INFO] Swagger: http://localhost:${port}/api`);
  console.log(`[INFO] Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('[INFO] CORS Origins: http://localhost:3000, http://localhost:3005, http://127.0.0.1:3000, http://127.0.0.1:3005');
  console.log(`[INFO] Rate Limiting: ${process.env.RATE_LIMIT_ENABLED === 'true' ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`[INFO] E-mail: ${process.env.EMAIL_ENABLED === 'true' ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`[INFO] Verificação de E-mail: ${process.env.REQUIRE_EMAIL_VERIFICATION === 'true' ? 'Obrigatória' : 'Opcional'}`);
  console.log(`[INFO] Database: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
  console.log('[INFO] Logs de Requisições: Habilitados');
  console.log('==========================================');
  console.log('Sistema pronto para receber requisições!');
  console.log('==========================================');
}

bootstrap();

