import { Component } from '@angular/core';
import { countries } from '@data/dashboard.data';
import { Settings, SettingsService } from '@services/settings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-visitors',
  standalone: true,
  imports: [
    NgxChartsModule,
    DirectivesModule
  ],
  templateUrl: './visitors.component.html',
  styleUrl: './visitors.component.scss'
})

export class VisitorsComponent {

  public countries: any[];
  
  public colorScheme: any = {
    domain: ['#378D3B', '#D22E2E', '#F47B00', '#AAAAAA']
  };

  public gradient: boolean = true;
  public tooltipDisabled: boolean = false;

  public visitorsLabelFormat(c: any): string {
    switch (c.label) {
      case 'Germany':
        return `<span class="flag-icon flag-icon-de mr-2"></span>${c.label}`;
      case 'France':
        return `<span class="flag-icon flag-icon-fr mr-2"></span>${c.label}`;
      case 'Great Britain':
        return `<span class="flag-icon flag-icon-gb mr-2"></span>${c.label}`;
      default:
        return c.label;
    }
  }

  public previousShowMenuOption: boolean;
  public previousMenuOption: string;
  public previousMenuTypeOption: string;
  public settings: Settings;

  constructor(public settingsService: SettingsService) {
    this.settings = this.settingsService.settings;
    this.initPreviousSettings();
  }

  ngOnInit() {
    setTimeout(() => this.countries = countries);
    this.countries = countries;
  }

  public onSelect(event: any) {
    // (event);
  }

  public ngDoCheck() {
    if (this.checkAppSettingsChanges()) {
      setTimeout(() => this.countries = [...countries]);
      this.initPreviousSettings();
    }
  }

  public checkAppSettingsChanges() {
    if (this.previousShowMenuOption != this.settings.theme.showMenu ||
      this.previousMenuOption != this.settings.theme.menu ||
      this.previousMenuTypeOption != this.settings.theme.menuType) {
      return true;
    }
    return false;
  }

  public initPreviousSettings() {
    this.previousShowMenuOption = this.settings.theme.showMenu;
    this.previousMenuOption = this.settings.theme.menu;
    this.previousMenuTypeOption = this.settings.theme.menuType;
  }

}
