import { Component } from '@angular/core';
import { disk_space } from '@data/dashboard.data';
import { Settings, SettingsService } from '@services/settings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-disk-space',
  standalone: true,
  imports: [
    NgxChartsModule,
    DirectivesModule
  ],
  templateUrl: './disk-space.component.html'
})
export class DiskSpaceComponent {
  public data: any[];
  public showLegend: boolean = false;
  public gradient: boolean = true;
  public colorScheme: any = {
    domain: ['#2F3E9E', '#D22E2E', '#378D3B']
  };
  public showLabels: boolean = true;
  public explodeSlices: boolean = true;
  public doughnut: boolean = false;
  public previousShowMenuOption: boolean;
  public previousMenuOption: string;
  public previousMenuTypeOption: string;
  public settings: Settings;

  constructor(public settingsService: SettingsService) {
    this.settings = this.settingsService.settings;
    this.initPreviousSettings();
  }

  ngOnInit() {
    this.data = disk_space;
  }

  public onSelect(event: any) {
    // (event);
  }

  public ngDoCheck() {
    if (this.checkAppSettingsChanges()) {
      setTimeout(() => this.data = [...disk_space]);
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
