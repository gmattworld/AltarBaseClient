import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRoutesConfig } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { HOST_NAME } from './infrastructure/tokens/host.token';
import { REQUEST } from './infrastructure/tokens/request.token';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRoutesConfig(serverRoutes),
    {
      provide: HOST_NAME,
      useFactory: (req: any) => req?.headers?.host || 'localhost',
      deps: [REQUEST]
    }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
