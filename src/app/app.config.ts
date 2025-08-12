import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading, withViewTransitions } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { MembershipData } from '@data/membership.data';
import { ToastrModule } from 'ngx-toastr';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { DatePipe, HashLocationStrategy, LocationStrategy } from '@angular/common';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    DatePipe,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withViewTransitions(),     
       
      withPreloading(PreloadAllModules),  // comment this line to enable lazy-loading
   
    ),
    importProvidersFrom(
      BrowserAnimationsModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
      // InMemoryWebApiModule.forRoot(MembershipData, { passThruUnknownUrl: true, delay: 0 }),
      ToastrModule.forRoot(),
      CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory
      }),
      // PrimeNG modules added here

    ),
    { provide: LocationStrategy, useClass: HashLocationStrategy } 
  ]
};
