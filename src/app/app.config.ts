import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEl from '@angular/common/locales/el';
import { LOCALE_ID } from '@angular/core';
import { OPERATIONS_REPOSITORY } from './core/services/operations.repository';
import { MockOperationsRepository } from './core/services/mock-operations.repository';
registerLocaleData(localeEl);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'el' },
    { provide: OPERATIONS_REPOSITORY, useExisting: MockOperationsRepository },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
