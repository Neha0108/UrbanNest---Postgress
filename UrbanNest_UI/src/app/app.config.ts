import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider} from '@abacritt/angularx-social-login';
import { routes } from './app.routes';

import { provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';

import { tokenInterceptor } from './interceptor/token-interceptor';
import { environment } from '../env/environment';

export const appConfig: ApplicationConfig = {
  providers: [
  
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top'
      })
    ),

    provideAnimations(),

    provideHttpClient(withFetch()),

    provideHttpClient(withInterceptors([tokenInterceptor])),
  ]
};