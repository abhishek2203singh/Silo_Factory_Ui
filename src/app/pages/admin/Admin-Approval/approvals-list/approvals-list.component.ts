import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import State from '../../../../Models/state.model';
import City from '../../../../Models/city.model';
import { ToastrService } from 'ngx-toastr';
import { Route, Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { InfoPanelData, InfoPanelsComponent } from '../../../dashboard/info-panels/info-panels.component';
import { PrintService } from '@services/print.service';

@Component({
    selector: 'app-approvals-list',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule],
    templateUrl: './approvals-list.component.html',
    styleUrl: './approvals-list.component.scss'
})
export class ApprovalsListComponent implements OnInit {
    infoPanels: InfoPanelData[] = [];
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
        private router: Router,
        private printService: PrintService,
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
        this.socketService.listen("approval:all").subscribe((res: any) => {
            this.rows = res.data
            console.log("braodcast =>", res.data)
            return
        });
        this.socketService.listen("Quality_Control").subscribe((res: any) => {
            if (res?.success) {
                this.rows = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
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
                // // console.log("data", res.data);

                this.updateInfoPanels();
            };
            req.send();
        });
    }

    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            // Convert numeric status to string (Active/Deactive) for filtering
            const statusText = item.status === 1 ? 'active' : 'deactive';
            // Create separate status check
            const statusMatch = val === 'active' ? item.status === 1 :
                val === 'deactive' || val === 'deact' ? item.status === 0 :
                    false;
            return (
                // Search in all relevant fields
                (this.datePipe.transform(item.date, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (item.entry_type_name?.toLowerCase().includes(val)) ||
                (item.master_product_type_name?.toLowerCase().includes(val)) ||
                (item.product_name?.toLowerCase().includes(val)) ||
                (item.packing_weight?.toString().toLowerCase().includes(val)) ||
                (item.quantity?.toString().toLowerCase().includes(val)) ||
                (item.unit_name?.toLowerCase().includes(val)) ||
                (item.priceper_unit?.toString().toLowerCase().includes(val)) ||
                (item.indepart_name?.toLowerCase().includes(val)) ||
                (item.indeprt_head_name?.toLowerCase().includes(val)) ||
                (item.send_deprt_name?.toLowerCase().includes(val)) ||
                (item.approval_status?.toLowerCase().includes(val)) ||
                (item.approval_by_name?.toLowerCase().includes(val)) ||
                statusMatch || // Use the new status matching logic
                !val
            );
        });

        // update the rows
        this.rows = filteredData;
        // Whenever the filter changes, always go back to the first page
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
        this.router.navigate(['/pages/admin/admin-approval/' + id]);
    }

    private countMilkItem(): number {
        return this.rows.filter(item => item.product_name === "Milk").reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }
    private countApprovedItems(): number {
        return this.rows.filter(item => item.approval_status === "Approved").length;
    }
    //   private countStockItems(): number {
    //     return this.rows.filter(item => item.entryTypeName === "Stock").length;
    //   }

    private updateInfoPanels(): void {
        const totalEntries = this.rows.length;
        const totalquantity = this.countMilkItem();
        const totalDemand = this.countApprovedItems();
        // const totalStock = this.countStockItems();

        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Quantity Available in Silo(Ltr) ', value: totalquantity, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Approved Data', value: totalDemand, icon: 'fa fa-table', color: '#378D3B', format: 'number' },
            //   { name: 'Entries of Demand', value: totalDemand, icon: 'fa fa-cubes', color: '#0096A6', format: 'number' },
            //   { name: 'Entries of Stock', value: totalStock, icon: 'fa fa-table', color: '#606060', format: 'number' },
            // { name: 'Total Quantity', value: totalquantity, icon: 'fa fa-cubes', color: '#F47B00', format: 'number' },
            // Add more panels as needed
        ];
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Date', 'Entry Type', 'Product Type', 'Product Name', 'Packaging Size', 'Quantity', 'Rejected Quantity', 'Price (Per Unit)', 'From Dept', 'From Head', 'To Dept',
            'Approval Status', 'Approved By', 'Status'];
        csvData.push(headers.join(','));
        this.rows.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                new Date(row.date).toLocaleDateString(),  // Formatted date
                row.entry_type_name,
                row.master_product_type_name,
                row.product_name,
                row.packing_weight,
                `${row.quantity} ${row.unit_name}`,
                ` ${row.rejected_quantity} ${row.unit_name}`,
                `${row.priceper_unit}/${row.unit_name}`,
                row.indepart_name,
                row.indeprt_head_name,
                row.send_deprt_name,
                row.approval_status,
                row.approval_by_name,
                row.status == "0" ? "Deactive" : "Active",

            ];
            csvData.push(rowData.map(item => `"${item}"`).join(',')); // Add quotes to escape commas in fields
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    printFile() {
        const headers = ['Sr. No', 'Date', 'Entry Type', 'Product Type', 'Product Name', 'Packaging Size', 'Quantity', 'Rejected Quantity', 'Price (Per Unit)', 'From Dept', 'From Head', 'To Dept',
            'Approval Status', 'Approved By', 'Status'];
        this.printService.print(headers, this.rows, (row, index) => [
            (index + 1).toString(),
            new Date(row.date).toLocaleDateString(),  // Formatted date
            row.entry_type_name,
            row.master_product_type_name,
            row.product_name,
            row.packing_weight,
            `${row.quantity} ${row.unit_name}`,
            ` ${row.rejected_quantity} ${row.unit_name}`,
            `${row.priceper_unit}/${row.unit_name}`,
            row.indepart_name,
            row.indeprt_head_name,
            row.send_deprt_name,
            row.approval_status,
            row.approval_by_name,
            row.status == "0" ? "Deactive" : "Active",
        ]);
    }

}
