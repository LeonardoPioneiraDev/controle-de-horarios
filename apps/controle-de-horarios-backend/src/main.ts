import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
       
      'http://127.0.0.1:3005'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    credentials: true,
  });

  // Configurar prefix global
  app.setGlobalPrefix('api');

  // Configurar pipes de validação
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // ❌ REMOVER QUALQUER GUARD GLOBAL
  // app.useGlobalGuards(...); // COMENTAR OU REMOVER

  // ❌ REMOVER QUALQUER INTERCEPTOR GLOBAL DE JWT
  // app.useGlobalInterceptors(...); // COMENTAR OU REMOVER

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Controle de Horários API')
    .setDescription('API para controle de horários de funcionários')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3336;
  await app.listen(port);

  console.log('🚀 ==========================================');
  console.log('🚀 CONTROLE DE HORÁRIOS - BACKEND INICIADO');
  console.log('🚀 ==========================================');
  console.log(`🌐 Servidor: http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origins: http://localhost:3000, http://localhost:3005, http://127.0.0.1:3000, http://127.0.0.1:3005`);
  console.log(`🛡️ Rate Limiting: ${process.env.RATE_LIMIT_ENABLED === 'true' ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`📧 E-mail: ${process.env.EMAIL_ENABLED === 'true' ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`🔐 Verificação E-mail: ${process.env.REQUIRE_EMAIL_VERIFICATION === 'true' ? 'Obrigatória' : 'Opcional'}`);
  console.log(`💾 Database: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
  console.log(`📊 Logs de Requisições: Habilitados`);
  console.log('🚀 ==========================================');
  console.log('🎯 Sistema pronto para receber requisições!');
  console.log('🚀 ==========================================');
}

bootstrap();