import { Component } from '@angular/core';
import { customers, orders, products, refunds } from '@data/dashboard.data';
import { Settings, SettingsService } from '@services/settings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-info-cards',
  standalone: true,
  imports: [
    NgxChartsModule
  ],
  templateUrl: './info-cards.component.html'
})
export class InfoCardsComponent {
  public orders: any[];
  public products: any[];
  public customers: any[];
  public refunds: any[];
  public colorScheme: any = {
    domain: ['#FFFFFF']
  };
  public autoScale: boolean = true;
  public previousShowMenuOption: boolean;
  public previousMenuOption: string;
  public previousMenuTypeOption: string;
  public settings: Settings;

  constructor(public settingsService: SettingsService) {
    this.settings = this.settingsService.settings;
    this.initPreviousSettings();
  }

  ngOnInit() {
    this.orders = orders;
    this.products = products;
    this.customers = customers;
    this.refunds = refunds;
    this.orders = this.addRandomValue('orders');
    this.customers = this.addRandomValue('customers');
  }

  public onSelect(event: any) {
    // (event);
  }

  public addRandomValue(param: any) {
    switch (param) {
      case 'orders':
        for (let i = 1; i < 30; i++) {
          this.orders[0].series.push({ "name": 1980 + i, "value": Math.ceil(Math.random() * 1000000) });
        }
        return this.orders;
      case 'customers':
        for (let i = 1; i < 15; i++) {
          this.customers[0].series.push({ "name": 2000 + i, "value": Math.ceil(Math.random() * 1000000) });
        }
        return this.customers;
      default:
        return this.orders;
    }
  }

  ngOnDestroy() {
    this.orders[0].series.length = 0;
    this.customers[0].series.length = 0;
  }

  public ngDoCheck() {
    if (this.checkAppSettingsChanges()) {
      setTimeout(() => this.orders = [...orders]);
      setTimeout(() => this.products = [...products]);
      setTimeout(() => this.customers = [...customers]);
      setTimeout(() => this.refunds = [...refunds]);
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
