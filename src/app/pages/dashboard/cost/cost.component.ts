import { Component } from '@angular/core';
import { cost } from '@data/dashboard.data';
import { Settings, SettingsService } from '@services/settings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../../theme/directives/directives.module';

function getNewTime(d: any) {
  let h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
    m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(),
    s = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds(),
    time = h + ":" + m + ":" + s;
  return time;
}

@Component({
  selector: 'app-cost',
  standalone: true,
  imports: [
    NgxChartsModule,
    DirectivesModule
  ],
  templateUrl: './cost.component.html'
})
export class CostComponent {
  public cost: any[];
  public showXAxis: boolean = true;
  public showYAxis: boolean = true;
  public gradient: boolean = true;
  public tooltipDisabled: boolean = false;
  public showLegend: boolean = false;
  public showXAxisLabel: boolean = true;
  public xAxisLabel: string = 'Time';
  public showYAxisLabel: boolean = true;
  public yAxisLabel: string = 'Cost';
  public colorScheme: any = {
    domain: ['#0096A6', '#D22E2E']
  };
  public autoScale: boolean = true;
  public previousShowMenuOption: boolean;
  public previousMenuOption: string;
  public previousMenuTypeOption: string;
  public settings: Settings;

  constructor(public settingsService: SettingsService) {
    this.settings = this.settingsService.settings;
    this.initPreviousSettings();
    setInterval(() => {
      this.cost = [...this.addRandomValue()];
    }, 3000);
  }

  ngOnInit() {
    this.cost = cost;
  }

  public onSelect(event: any) {
    // (event);
  }

  public addRandomValue() {
    let value1 = Math.random() * 1000000;
    this.cost[0].series.push({ "name": getNewTime(new Date()), "value": value1 });
    let value2 = Math.random() * 1000000;
    this.cost[1].series.push({ "name": getNewTime(new Date()), "value": value2 });
    if (this.cost[0].series.length > 5) this.cost[0].series.splice(0, 1);
    if (this.cost[1].series.length > 5) this.cost[1].series.splice(0, 1);
    return this.cost;
  }

  ngOnDestroy() {
    this.cost[0].series.length = 0;
  }

  public ngDoCheck() {
    if (this.checkAppSettingsChanges()) {
      setTimeout(() => this.cost = [...cost]);
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
