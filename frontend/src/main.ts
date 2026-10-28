import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { registerLocaleData } from '@angular/common';
import localeHu from '@angular/common/locales/hu';

ModuleRegistry.registerModules([AllCommunityModule]);

// Magyar nyelvi beállítások regisztrálása
registerLocaleData(localeHu, 'hu-HU');

bootstrapApplication(AppComponent, appConfig).catch((error) =>
  console.error(error),
);
