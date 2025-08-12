import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';


@Component({
  selector: 'app-vendor-payment',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule],
  templateUrl: './vendor-payment.component.html',
  styleUrl: './vendor-payment.component.scss'
})
export class VendorPaymentComponent {

  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
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
    this.selection = SelectionType.checkbox;
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
      setTimeout(() => { this.loadingIndicator = false; }, 1500);
    });
  }

  fetch(callback: (data: any) => void) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      callback(JSON.parse(req.response));
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

  updateValue(event: any, cell: any, row: any) {
    this.editing[row.$$index + '-' + cell] = false;
    this.rows[row.$$index][cell] = event.target.value;
  }

  onSelect({ selected }: any) {
    // ('Select Event', selected, this.selected);
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  previewImageUrl: string;
  previewImage(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          this.previewImageUrl = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

}
