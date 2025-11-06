import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { registerLocaleData } from '@angular/common';
import localeHu from '@angular/common/locales/hu';

// Register AG Grid Community modules once at app startup
ModuleRegistry.registerModules([AllCommunityModule]);

// Register Hungarian locale data for pipes using 'hu-HU'
registerLocaleData(localeHu, 'hu-HU');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
