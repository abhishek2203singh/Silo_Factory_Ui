import { Component, ViewChild } from '@angular/core';
import { InfoPanelsComponent } from './info-panels/info-panels.component';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-regular-customers',
  standalone: true,
  imports: [InfoPanelsComponent,NgxDatatableModule],
  templateUrl: './regular-customers.component.html',
  styleUrl: './regular-customers.component.scss'
})
export class RegularCustomersComponent {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;

  columns = [
    { prop: 'name' },
    { name: 'Gender' },
    { name: 'Company' }
  ];

  constructor() {
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
    });
  }

  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) !== -1 || !val;
    });
    this.rows = temp;
    this.table.offset = 0;
  }

  updateValue(event: any, cell: any, cellValue: any, row: any) {
    this.editing[row.$$index + '-' + cell] = false;
    this.rows[row.$$index][cell] = event.target.value;
  }
}
