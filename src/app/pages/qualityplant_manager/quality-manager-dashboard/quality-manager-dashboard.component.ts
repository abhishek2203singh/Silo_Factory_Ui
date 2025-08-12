import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import State from '../../../Models/state.model';
import City from '../../../Models/city.model';
import { ToastrService } from 'ngx-toastr';
import { Route, Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { InfoPanelData, InfoPanelsComponent } from '../../dashboard/info-panels/info-panels.component';
import { Subscription } from 'rxjs';
declare var $: any; // For jQuery modal

@Component({
    selector: 'app-quality-manager-dashboard',
    standalone: true,
    imports: [NgxDatatableModule, InfoPanelsComponent, CommonModule,],
    templateUrl: './quality-manager-dashboard.component.html',
    styleUrl: './quality-manager-dashboard.component.scss'
})
export class QualityManagerdashboardComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    selected: any[] = [];
    stateList: State[];
    cities: City[];
    infoPanels: InfoPanelData[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    stockOutData: any;
    returnData: any;
    imgurl: any;
    selectedRow: any = null;
    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    private subscriptions: Subscription[] = [];

    constructor(
        public baseService: BaseService,
        private socketService: SocketService,
        private toaster: ToastrService,
        private router: Router,
        private datePipe: DatePipe
    ) {
        this.imgurl = baseService.imageurl;
        this.selection = SelectionType.checkbox;
        this.fetch((data: any) => {
            this.temp = [...data];
            this.rows = data;
            setTimeout(() => { this.loadingIndicator = false; }, 1500);
        });
    }

    ngOnInit(): void {
        this.listenAdmiReturn();

        this.socketService.listen('approval:all').subscribe((res: any) => {
            if (res.success) {
                this.rows = res.data;
                // console.log("success", this.rows);
                this.temp = [...this.rows];
                this.updateInfoPanels();
            }
        });
    }
    fetch(callback: (data: any) => void) {
        const req = new XMLHttpRequest();
        this.socketService.emit("approval:all", {});
        this.socketService.listen('allapproval').subscribe((res: any) => {

            req.open('GET', res.data);
            req.onload = () => {
                callback(res.data);
            };
            req.send();
        });

    }
    listenAdmiReturn() {
        const ars = this.socketService.listen("common:admin-return-details").subscribe((res: any) => {
            if (res?.success) {
                // console.log("curent data =>", res.data)
                // if data exists then open modal
                if (res.data) {

                    const { returDetails, stockOutDetails } = res.data;
                    this.stockOutData = stockOutDetails;
                    this.returnData = returDetails

                    // const res = {
                    //     returDetails: returnData,
                    //     stockOutDetails: stockOutData
                    // }
                    $('#quantityInfoModal').modal('show');

                }
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })

        this.subscriptions.push(ars)
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        // Filter the data based on the search input
        const filteredData = this.temp.filter((item: any) => {
            return (
                // Basic information
                (item.entry_type_name?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                // Product-related
                (item.product_name?.toLowerCase().includes(val)) ||
                (item.master_product_type_name?.toLowerCase().includes(val)) ||
                (item.packing_weight?.toString().toLowerCase().includes(val)) ||
                (item.weight_per_unit?.toString().toLowerCase().includes(val)) ||
                // Quantity and Unit Information
                (item.quantity?.toString().toLowerCase().includes(val)) ||
                // Manager and Approval Information
                (item.indepart_name?.toLowerCase().includes(val)) ||
                (item.indeprt_head_name?.toLowerCase().includes(val)) ||
                (item.send_deprt_name?.toLowerCase().includes(val)) ||
                (item.send_deprthead_name?.toLowerCase().includes(val)) ||
                (item.approval_status?.toLowerCase().includes(val)) ||
                (item.approval_by_name?.toLowerCase().includes(val))
            );
        });

        // Update the displayed rows
        this.rows = filteredData;

        // Reset to the first page when the filter changes
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


    DetailsRows(id: any) {
        this.router.navigate(['/pages/approvals/' + id]);
    }

    private countQuantity(): number {
        return this.rows.filter(item => item.quantity).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }

    private countRequest(): number {
        return this.rows.filter(item => item.entry_type_name === "Request").length;
    }
    private counttotalStockout(): number {
        return this.rows.filter(item => item.entry_type_name === "Stock Out").length;
    }
    private countApprovalStatus(): number {
        return this.rows.filter(item => item.approval_status === "Pending").length;
    }
    private countManagerApproved(): number {
        return this.rows.filter(item => item.approval_status === "Approved").length;
    }

    private updateInfoPanels(): void {
        const totalEntries = this.rows.length;
        const totalquantity = this.countQuantity();
        const totalApproved = this.countManagerApproved();
        const totalStockout = this.counttotalStockout();
        const totalPending = this.countApprovalStatus();
        const totalStock = this.countRequest();


        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Quantity Available(Ltr) ', value: totalquantity, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Entries of Stock Out', value: totalStockout, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
            { name: 'Entries of Request', value: totalStock, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
            { name: 'Total Pending', value: totalPending, icon: 'fa fa-circle-o-notch', color: '#378D3B', format: 'number' },
            { name: 'Total Approved', value: totalApproved, icon: 'fa fa-cube', color: '#F47B00', format: 'number' },
        ];
    }

    openQuantityModal(row: any) {
        // debugger
        if (row.admin_table_ref_id) {
            this.socketService.emit("common:admin-return-details", { id: row.admin_table_ref_id })
        }
        // console.log("curret row details =>", row)
        this.selectedRow = row;

    }

}
