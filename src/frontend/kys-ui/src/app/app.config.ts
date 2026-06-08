import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { authReducer } from './core/store/auth/auth.reducer';
import { AuthEffects } from './core/store/auth/auth.effects';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    provideRouterStore(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
