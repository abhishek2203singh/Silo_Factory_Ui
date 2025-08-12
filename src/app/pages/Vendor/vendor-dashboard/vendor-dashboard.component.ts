import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { InfoPanelsComponent } from './info-panels/info-panels.component';
import State from '../../../Models/state.model';
import City from '../../../Models/city.model';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { BaseService } from '@services/Base.service';

@Component({
    selector: 'app-vendor-dashboard',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, InfoPanelsComponent],
    templateUrl: './vendor-dashboard.component.html',
    styleUrl: './vendor-dashboard.component.scss'
})
export class VendorDashboardComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    selected: any[] = [];
    stateList: State[];
    cities: City[]
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    imgurl: any;
    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;

    columns = [
        { prop: 'name' },
    ];

    constructor(
        public baseService: BaseService,
        private socketService: SocketService,
        private toaster: ToastrService,
        private router: Router
    ) {      
        this.imgurl = baseService.imageurl;     
    }

    ngOnInit(): void {
        this.getStates();
        this.getTableData();
    }

    getStates() {
        this.socketService.emit("location:states", {});
        this.socketService.listen("location:states").subscribe((res: any) => {
            if (res?.success) {
                this.stateList = res.data;
                return;
            }
            this.toaster.error(res.message);
            if (res.error === 402) {
                this.socketService.Logout();
                this.router.navigate(['/login']);
                return;
            }
        });
    }

    getTableData() {
        this.socketService.emit("quality:fetchtablebyvendorId", {});
        this.socketService.listen('quality:fetchtablebyvendorId').subscribe((res: any) => {
            if (res?.success) {
                this.temp = [...res.data];
                this.rows = res.data;
            } else {
                this.toaster.error(res.message || 'Failed to fetch table data');
            }
        });
    }

    updateFilter(event: any) {
        const val = event.value.toLowerCase();
        this.rows = this.temp.filter(d => 
            d.DprtHeadFullName.toLowerCase().includes(val) ||
            d.product_name.toLowerCase().includes(val) ||
            d.date.toLowerCase().includes(val) ||
            d.quantity.toLowerCase().includes(val) ||
            d.DprtName.toLowerCase().includes(val)
        );
        this.table.offset = 0;
    }

    updateValue(event: any, cell: any, row: any) {
        this.editing[row.$$index + '-' + cell] = false;
        this.rows[row.$$index][cell] = event.target.value;
    }

    onSelect({ selected }: any) {
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
    DetailsRows(id: any) {
        this.router.navigate(['/pages/vendor-Details-view/' + id]);
    }
}