import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '../../../services/Socket.service';
import { ToastrService, GlobalConfig } from 'ngx-toastr';

@Component({
    selector: 'app-vendor-reports',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule],
    templateUrl: './vendor-reports.component.html',
    styleUrl: './vendor-reports.component.scss'
})
export class VendorReportsComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    selected: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;

    columns = [
        { name: 'Image' },
        { name: 'Payment' },
        { name: 'Quantity' },
        { name: 'Price Per Unit' },
        { name: 'Product' },
    ];

    constructor(public toastr: ToastrService, private webSockets: SocketService) {
        this.selection = SelectionType.checkbox;
    }

    ngOnInit(): void {
        this.getvendorDataListen();
        this.getvendorData()
    }

    getvendorDataListen() {
        this.webSockets.listen('Report:vendorByid').subscribe((res: any) => {
            if (res.success) {
                this.rows = res.data
            } else {
                this.toastr.error(res.message)
            }
        })
    }
    getvendorData() {
        this.webSockets.emit("Report:vendorByid", { "vendorId": 9 });
    }

    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        this.temp = [...this.rows]
        const temp = this.temp.filter((d) => {
            return Object.keys(d).some((key) => {
                return String(d[key]).toLowerCase().includes(val);
            });
        });
        if (this.table) {
            this.table.offset = 0;
        }
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