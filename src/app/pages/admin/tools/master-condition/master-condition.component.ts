import { Component, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-master-condition',
  standalone: true,
  imports: [NgxDatatableModule],
  templateUrl: './master-condition.component.html',
  styleUrl: './master-condition.component.scss'
})
export class MasterConditionComponent {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;

  columns = [
    { prop: 'name' },
    { name: 'Gender' },
    { name: 'Company' }
  ];

  constructor() {
    this.selection = SelectionType.checkbox;
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




}
