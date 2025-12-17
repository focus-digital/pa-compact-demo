import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

import { SESSION_COOKIE_NAME, setupUserAuth } from './api/plugins/userAuth.js';
import { UserService } from '@/service/userService.js';
import { AuthService } from '@/service/authService.js';
import { authRoutes } from '@/api/routes/auth-routes.js';
import { userRoutes } from '@/api/routes/user-routes.js';
import { licenseRoutes } from '@/api/routes/license-routes.js';
import { LicenseService } from '@/service/licenseService.js';
import { PractitionerService } from './service/practitionerService.js';

export interface ServerDependencies {
  prisma?: PrismaClient;
  userService?: UserService;
  authService?: AuthService;
  practitionerService?: PractitionerService;
  licenseService?: LicenseService;
}

const API_ROUTE_PREFIX = { prefix: '' };
export const AUTH_EXEMPT_PATHS = ['/health', '/login', '/logout', '/docs'];
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const allowedOrigins = ALLOWED_ORIGIN ? [ALLOWED_ORIGIN] : [];

export function buildServer(
  options: FastifyServerOptions = {},
  dependencies: ServerDependencies = {},
): FastifyInstance {
  const fastify = Fastify({
    logger: true,
    ...options,
  });

  fastify.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allowed methods
    credentials: true, // If you use cookies or auth headers
  });
  fastify.register(fastifyCookie);
  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Fullstack Template API',
        description: 'HTTP API documentation',
        version: '1.0.0',
      },
      servers: [{ url: '/' }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: SESSION_COOKIE_NAME,
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'UUID',
          },
        },
      },
    },
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    staticCSP: true,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  const prisma = dependencies.prisma ?? new PrismaClient();
  const userService =
    dependencies.userService ?? new UserService(prisma);
  const authService =
    dependencies.authService ?? new AuthService(prisma);
  const licenseService =
    dependencies.licenseService ?? new LicenseService(prisma);
  const practitionerService =
    dependencies.practitionerService ?? new PractitionerService(prisma);

  // middleware
  setupUserAuth(fastify, { authService });

  // routes
  fastify.register((instance) => {
    instance.get(
      '/health',
      {
        schema: {
          tags: ['health'],
          summary: 'API healthcheck',
          response: {
            200: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ok'] },
              },
              required: ['status'],
              additionalProperties: false,
            },
          },
        },
      },
      async () => ({ status: 'ok' }),
    );
  }, API_ROUTE_PREFIX);
  fastify.register(authRoutes, { dependencies: { authService, userService }, ...API_ROUTE_PREFIX });
  fastify.register(userRoutes, { dependencies: { userService }, ...API_ROUTE_PREFIX });
  fastify.register(licenseRoutes, { dependencies: { licenseService }, ...API_ROUTE_PREFIX });

  fastify.addHook('onClose', async () => {
    if (!dependencies.prisma) {
      await prisma.$disconnect();
    }
  });

  return fastify;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  const start = async () => {
    const server = buildServer();

    try {
      await server.listen({ port, host });
    } catch (error) {
      server.log.error(error, 'fastify failed to start');
      process.exit(1);
    }
  };

  start();
}
