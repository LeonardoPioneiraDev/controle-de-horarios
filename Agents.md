# Instruções Completas para Desenvolvimento da Aplicação Web
Instruções Gerais de Desenvolvimento
Você vai me ajudar no desenvolvimento de uma aplicação web. Para melhor entendimento você deve consultar código da aplicação. Vamos implementar novas funcionalidades ao sistema que está em desenvolvimento, melhorar o que já tem e torná-lo realmente usável por muitos usuários.

Para isso você deve:

Seguir as melhores práticas de desenvolvimento do mercado
Não fazer implementações apressadas, sem levar consideração o contexto real do código já criado
Nunca criar código deduzindo outros existentes, acesse sempre o arquivo que precisar para entender como tudo vai se encaixar
Nunca fazer código "PROVISÓRIO", isto é, código feito com pressa pensando em depois voltar e melhorar ele, já faça o melhor por padrão
Nunca faça arquivos gigantescos que fazem tudo, use sempre abstração e separação de responsabilidades seguindo padrão de grandes empresas, não faça de forma apressada pensando que "depois vamos melhorar", já faça toda abstração de código na hora mesmo, mas cuidado com over engineering, faça apenas o necessário de forma limpa e robusta
Sugira ideias: não é porque o projeto atual faz algo de um jeito X que está 100% certo, desenvolvedores se enganam, você deve, com sua expertise, sugerir fazer algo de forma diferente se essa forma for realmente melhor que a que está implementada
Leve em conta que essa aplicação vai escalar para muitos usuários e fluxo de informações, sugira implementação robusta
No uso de typescript não use any como tipagem, jamais! sempre faça tipagens de real uso para que não gerem problema de build depois, caso tenha dúvida no uso de uma tipagem acesse o arquivo de onde ela vem
Cuidado ao implementar novas funcionalidades, não faça algo que já existe, acesse sempre o arquivo de onde a funcionalidade está implementada para verificar se já existe
Cuidado com falhas de segurança como SQL Injection, XSS, CSRF, IDOR, etc.
Frontend: A filosofia do frontend é bem focada em optimistic ui, ou seja, sempre tente fazer as requisições ao backend o mais rápido possível, sem bloquear a interface do usuário. É inaceitável fazer uma requisição ao backend e esperar a resposta, bloquear a interface do usuário, ter componente que não atualiza por mal uso do react query. Sua task será reprovada se não cumprir com essa filosofia.
Sua task será reprovada se não seguir essas diretrizes.
Stack Tecnológico
Backend
Framework: NestJS (Node.js)
Banco de Dados: PostgreSQL
ORM: TypeORM
Containerização: Docker + Docker Compose
Versionamento: GitHub
Frontend
Framework: React 18+ com TypeScript
State Management: React Query + Zustand/Context API
Styling: Tailwind CSS ou Styled Components
Build Tool: Vite ou Next.js
DevOps e Infraestrutura
Containerização: Docker
CI/CD: GitHub Actions
Versionamento: GitHub com Git Flow
Deploy: Docker containers (AWS/GCP/Azure)
Design System e UI/UX
Paleta de Cores
css
Copiar

:root {
  /* Cores principais */
  --primary-yellow: #fbcc2c;
  --secondary-green: #c7cd69;
  --accent-yellow: #e6cd4a;
  --neutral-yellow: #d4cc54;
  --bright-yellow: #ecd43c;
  
  /* Cores de contraste */
  --black: #000000;
  --dark-gray: #1a1a1a;
  --medium-gray: #666666;
  --light-gray: #f5f5f5;
  --white: #ffffff;
  
  /* Estados */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
Responsividade
Mobile First: Começar sempre pelo design mobile
Breakpoints obrigatórios:
css
Copiar

/* Mobile pequeno */
@media (min-width: 320px) { }

/* Mobile médio */
@media (min-width: 375px) { }

/* Mobile grande */
@media (min-width: 414px) { }

/* Tablet pequeno */
@media (min-width: 768px) { }

/* Tablet grande */
@media (min-width: 1024px) { }

/* Desktop */
@media (min-width: 1280px) { }

/* Desktop grande */
@media (min-width: 1440px) { }

/* Ultra wide */
@media (min-width: 1920px) { }
Acessibilidade
Implementar navegação por teclado
Usar atributos ARIA apropriados
Garantir contraste mínimo de 4.5:1 para texto normal
Implementar focus visível em todos os elementos interativos
Suporte a leitores de tela
Performance e Otimização
Frontend Performance
Optimistic UI obrigatório: Nunca bloquear a interface do usuário
Implementar loading states inteligentes
Usar React Query corretamente para cache e sincronização
Lazy loading para componentes e imagens
Code splitting por rotas
Otimização de imagens (WebP, AVIF)
Implementar Service Workers para cache
Backend Performance
Implementar cache em múltiplas camadas
Otimizar queries do banco de dados
Usar índices apropriados
Implementar paginação eficiente
Compressão de respostas (gzip/brotli)
Arquitetura e Estrutura
Organização de Código
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes básicos (Button, Input, etc.)
│   ├── forms/           # Componentes de formulário
│   └── layout/          # Componentes de layout
├── pages/               # Páginas da aplicação
├── hooks/               # Custom hooks
├── services/            # Serviços e APIs
├── utils/               # Utilitários
├── types/               # Definições de tipos
├── constants/           # Constantes da aplicação
├── contexts/            # Contexts do React
└── styles/              # Estilos globais
Padrões de Nomenclatura
Componentes: PascalCase (UserProfile.tsx)
Hooks: camelCase com prefixo "use" (useUserData.ts)
Utilitários: camelCase (formatCurrency.ts)
Constantes: UPPER_SNAKE_CASE (API_ENDPOINTS)
Tipos: PascalCase (UserData, ApiResponse)
Ferramentas de Documentação e Integração
1. Documentação de API Automática
Swagger/OpenAPI com NestJS
typescript
Copiar

// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('API Documentation')
  .setDescription('Documentação automática da API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
Configuração no Controller
typescript
Copiar

// user.controller.ts
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // implementação
  }
}
2. TypeORM - Documentação de Schema
Configuração TypeORM
typescript
Copiar

// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      cli: {
        migrationsDir: 'src/migrations'
      }
    }),
  ],
})
export class AppModule {}
Entity com Documentação
typescript
Copiar

// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID único do usuário' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nome completo do usuário' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Email único do usuário' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ description: 'Data de criação' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @UpdateDateColumn()
  updatedAt: Date;
}
3. Documentação de Código e Componentes
Storybook para React
bash
Copiar

# Instalação
npx storybook@latest init
npm install --save-dev @storybook/addon-docs
typescript
Copiar

// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Componente de botão reutilizável com variações de estilo'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Botão Primário'
  }
};
4. Documentação Técnica Automática
TypeDoc para TypeScript
bash
Copiar

npm install --save-dev typedoc
json
Copiar

// typedoc.json
{
  "entryPoints": ["src"],
  "out": "docs",
  "theme": "default",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeExternals": true
}
JSDoc para Documentação de Código
typescript
Copiar

/**
 * Serviço responsável por gerenciar usuários
 * @class UserService
 */
@Injectable()
export class UserService {
  /**
   * Cria um novo usuário no sistema
   * @param {CreateUserDto} createUserDto - Dados para criação do usuário
   * @returns {Promise<User>} Usuário criado
   * @throws {ConflictException} Quando email já existe
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // implementação
  }
}
5. Versionamento e Changelog
Conventional Commits + Release Please
bash
Copiar

# Instalação
npm install --save-dev @commitlint/cli @commitlint/config-conventional
npm install --save-dev husky
json
Copiar

// package.json
{
  "scripts": {
    "release": "release-please release-pr --token=$GITHUB_TOKEN --repo-url=owner/repo"
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
Semantic Release
yaml
Copiar

# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npx semantic-release
6. GitHub Actions para Documentação
Workflow para Deploy de Docs
yaml
Copiar

# .github/workflows/docs.yml
name: Deploy Documentation
on:
  push:
    branches: [main]
    paths: ['src/**', 'docs/**']

jobs:
  deploy-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate API docs
        run: npm run docs:api
        
      - name: Build Storybook
        run: npm run build-storybook
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
7. Docker para Documentação
Dockerfile para Docs
dockerfile
Copiar

# Dockerfile.docs
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build-storybook
RUN npm run docs:api

EXPOSE 3000

CMD ["npm", "run", "serve-docs"]
Docker Compose com Docs
yaml
Copiar

# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/mydb

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  docs:
    build:
      context: .
      dockerfile: Dockerfile.docs
    ports:
      - "6006:6006"
    command: npm run storybook

volumes:
  postgres_data:
8. Ferramentas de Integração Avançadas
Compodoc para NestJS
bash
Copiar

npm install --save-dev @compodoc/compodoc
json
Copiar

// package.json
{
  "scripts": {
    "docs:serve": "compodoc -p tsconfig.json -s",
    "docs:build": "compodoc -p tsconfig.json"
  }
}
GitBook + GitHub Integration
yaml
Copiar

# .gitbook.yaml
root: ./docs

structure:
  readme: README.md
  summary: SUMMARY.md

plugins:
  - github
  - swagger
9. Monitoramento e Métricas de Documentação
Lighthouse CI para Docs
yaml
Copiar

# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.js'
          uploadArtifacts: true
Desenvolvimento e Manutenção
Testes
Testes unitários obrigatórios para funções críticas
Testes de integração para fluxos principais
Testes E2E para jornadas do usuário
Coverage mínimo de 80%
Documentação
README detalhado com instruções de setup
Documentação de APIs
Comentários em código complexo
Changelog atualizado
Git e Versionamento
Commits semânticos (Conventional Commits)
Branches por feature
Pull requests obrigatórios
Code review antes do merge
Experiência do Usuário
Estados da Interface
Loading states para todas as operações
Empty states informativos
Error states com ações de recuperação
Success states com feedback claro
Interações
Feedback visual imediato para todas as ações
Animações suaves (max 300ms)
Debounce em inputs de busca
Confirmação para ações destrutivas
Deploy e Monitoramento
Ambiente de Produção
Variáveis de ambiente para configurações
Logs estruturados
Monitoramento de performance
Alertas para erros críticos
Backup automático de dados
SEO e Meta Tags
Meta tags dinâmicas por página
Open Graph tags
Schema markup quando aplicável
Sitemap.xml atualizado
Scripts Package.json Recomendados
json
Copiar

{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    
    "docs:api": "compodoc -p tsconfig.json -s",
    "docs:build": "compodoc -p tsconfig.json",
    "docs:swagger": "npm run start:dev",
    
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/config/database.config.ts",
    "migration:run": "npm run typeorm -- migration:run -d src/config/database.config.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d src/config/database.config.ts",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    
    "lint": "eslint "{src,apps,libs,test}/**/*.ts" --fix",
    "format": "prettier --write "src/**/*.ts" "test/**/*.ts"",
    
    "docker:build": "docker build -t myapp .",
    "docker:run": "docker-compose up -d",
    "docker:stop": "docker-compose down"
  }
}
Estrutura de Projeto Recomendada
project-root/
├── src/
│   ├── modules/
│   │   ├── user/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── user.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   ├── migrations/
│   └── main.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── stories/
│   └── public/
├── docs/
│   ├── api/
│   ├── components/
│   └── guides/
├── docker/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── Dockerfile
└── README.md
Importante
Qualquer implementação que não siga essas diretrizes será REPROVADA. A qualidade e robustez do código são prioridades absolutas neste projeto. Essas regras garantem que a aplicação seja escalável, maintível, acessível e ofereça uma excelente experiência do usuário em todos os dispositivos.





