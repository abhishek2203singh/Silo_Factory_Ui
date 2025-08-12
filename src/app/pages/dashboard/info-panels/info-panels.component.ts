import { Component, Input, OnChanges } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';

export interface InfoPanelData {
  name: string;
  value: number;
  icon: string;
  color: string;
  format?: 'number' | 'currency' | 'percent';
}

@Component({
  selector: 'app-info-panels',
  standalone: true,
  imports: [
    NgxChartsModule,
    CommonModule
  ],
  template: `
    <div class="row">
      <div *ngFor="let panel of panels" class="col-xl-2 col-lg-4 col-md-4 col-sm-6 pl-2 pr-2 mb-4">
        <div class="w-100 h-100p">
          <ngx-charts-number-card
            [cardColor]="panel.color"
            [bandColor]="panel.color"
            [textColor]="'#fff'"
            [emptyColor]="'#fff'"
            [innerPadding]="0"
            [results]="[{ name: panel.name, value: panel.value }]"
            [valueFormatting]="infoValueFormat"
            [labelFormatting]="infoLabelFormat"
            (select)="onSelect($event)">
          </ngx-charts-number-card>
        </div>
      </div>
    </div>
  `
})
export class InfoPanelsComponent implements OnChanges {
  @Input() panels: InfoPanelData[] = [];

  ngOnChanges() {
    // This method can be used if you need to perform any actions when panels change
  }

  public infoLabelFormat = (c: any): string => {
    const panel = this.panels.find(p => p.name === c.data.name);
    return panel ? `<i class="${panel.icon} mr-2"></i>${c.label}` : c.label;
  }

  public infoValueFormat = (c: any): string => {
    const panel = this.panels.find(p => p.name === c.data.name);
    switch (panel?.format) {
      case 'currency':
        return `$${Math.round(c.value).toLocaleString()}`;
      case 'percent':
        return `${Math.round(c.value * 100)}%`;
      default:
        return c.value.toLocaleString();
    }
  }

  public onSelect(event: any) {

  }
}