import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

import { provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';

import { SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';


import { tokenInterceptor } from './interceptor/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provide: 'SocialAuthServiceConfig',
    useValue: {
      autoLogin: false,
      providers: [
        {
          id: 'GoogleLoginProvider.PROVIDER_ID',
          provider: new GoogleLoginProvider('YOUR_GOOGLE_CLIENT_ID')
        }
      ]
    } as SocialAuthServiceConfig,

    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top'
      })
    ),

    provideAnimations(),

    provideHttpClient(withFetch()),

    provideHttpClient(
      withInterceptors([tokenInterceptor])
    )
  ]
};