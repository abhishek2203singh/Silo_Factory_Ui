import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { InfoPanelsComponent, InfoPanelData } from '../dashboard/info-panels/info-panels.component';
import { InfoCardsComponent } from '../dashboard/info-cards/info-cards.component';
import Swal from 'sweetalert2';
import { PrintService } from '@services/print.service';
import { Subscription } from 'rxjs';
import { UtilityService } from '@services/utility.service';
declare var $: any; // For jQuery modal
@Component({
    selector: 'app-silo-department',
    standalone: true,
    imports: [
        NgxDatatableModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InfoPanelsComponent,
    ],
    templateUrl: './silo-department.component.html',
    styleUrls: ['./silo-department.component.scss']
})
export class SiloDepartmentComponent implements OnInit {
    @ViewChild(DatatableComponent) table!: DatatableComponent;
    selectedRow: any = null;
    infoPanels: InfoPanelData[] = [];
    silosdata: any[] = [];
    temp: any[] = [];
    apprvlList: any[] = [];
    DepartmentForm: FormGroup;
    isEditDepartment = false;
    editDeparmentId = 0;
    departmentList: any[] = [];
    currentDepartmentId: number;
    stockOutData: any;
    returnData: any;
    @ViewChild('openButton') openButton: ElementRef | undefined;
    @ViewChild('closeButton') closeButton: ElementRef | undefined;
    private fb = inject(FormBuilder);
    private socketService = inject(SocketService);
    private router = inject(Router);
    private toaster = inject(ToastrService);
    private subscriptions: Subscription[] = [];
    constructor(private printService: PrintService, private datePipe: DatePipe, public util: UtilityService) {
        this.DepartmentForm = this.fb.group({
            departmentName: ['', [Validators.required]],
            priorityLevel: ['', [Validators.required]],
            departmentId: ['']
        });
    }
    ngOnInit(): void {
        this.setupSocketListeners();
        this.getAllData();
        this.getMastApprovalList();
        this.loadDepartments();
        this.acceptStockListner()
        this.listenAdmiReturn()
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
                (item.entryTypeName?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                // Product-related
                (item.productName?.toLowerCase().includes(val)) ||
                (item.product_type_name?.toLowerCase().includes(val)) ||
                (item.packing_size?.toString().toLowerCase().includes(val)) ||
                (item.st_name?.toLowerCase().includes(val)) ||
                // Quantity and Unit Information
                (item.qty?.toString().toLowerCase().includes(val)) ||
                (item.unitShortName?.toLowerCase().includes(val)) ||
                (item.QtysiloBox?.toString().toLowerCase().includes(val)) ||
                // Manager and Approval Information
                (item.Name?.toLowerCase().includes(val)) ||
                (item.approval_status?.toString().toLowerCase().includes(val)) ||
                (item.appmangerName?.toLowerCase().includes(val)) ||
                (item.approvalname?.toLowerCase().includes(val))
            );
        });
        // Update the displayed rows
        this.silosdata = filteredData;
        // Reset to the first page when the filter changes
        this.table.offset = 0;
    }
    private setupSocketListeners(): void {
        this.socketService.listen("error").subscribe((error: any) => {
            this.toaster.error(error.message);
            if (error.error == 402) {
                this.socketService.Logout();
            }
        });
        this.socketService.listen('approval:change-destination-approval-status').subscribe((res: any) => {
            if (res?.success) {
                this.toaster.success(res.message)
                this.getMastApproval();
                return
            }
            this.toaster.error(res.message)
        });
        this.socketService.listen('silos-dpt:all').subscribe((res: any) => {
            if (res?.success) {
                this.silosdata = res.data;
                // console.log("silosdata :", res.data)
                this.temp = [...this.silosdata]; // Create a copy of the initial data
                this.updateInfoPanels();
            }
        });
        // to slisten broad cast 
        this.socketService.listen('Silo_Department').subscribe((res: any) => {
            if (res?.success) {
                this.silosdata = res.data;
                this.updateInfoPanels();
            }
        });
        this.socketService.listen('ms-approval-status:all').subscribe((res: any) => {
            if (res?.success) {
                this.apprvlList = res.data;
            }
        });
    }
    private countItemsByEntryId(entryId: string): number {
        return this.silosdata.filter(item => item.EntryId == entryId).length;
    }
    private updateInfoPanels(): void {
        const totalEntries = this.silosdata.length;
        const totalQtysiloBox = this.silosdata.reduce((sum, item) => sum + (Number(item.QtysiloBox) || 0), 0);
        const totalStockOut = this.countItemsByEntryId("4");
        const totalDemand = this.countItemsByEntryId("1");
        const totalStockIn = this.countItemsByEntryId("3");
        const totalRequest = this.countItemsByEntryId("2");
        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Quantity Available in Silo(Ltr) ', value: totalQtysiloBox, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Entries of Request', value: totalRequest, icon: 'fa fa-table', color: '#378D3B', format: 'number' },
            { name: 'Entries of Demand', value: totalDemand, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
            { name: 'Entries of Stock (In)', value: totalStockIn, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
            { name: 'Entries of Stock (Out)', value: totalStockOut, icon: 'fa fa-sign-out', color: '#F47B00', format: 'number' },
        ];
    }
    loadDepartments() {
        this.socketService.emit("department:all", {});
        this.subscriptions.push(
            this.socketService.listen("department:all").subscribe((department: any) => {
                this.departmentList = department.data;
                // Find silo department ID
                const siloDept = this.departmentList.find(
                    dept => dept.name.toLowerCase().includes('silo')
                );
                if (siloDept) {
                    this.currentDepartmentId = siloDept.id;
                }
                // ('Received department data:', department);
            }),
            // BROAD CAST 
            this.socketService.listen("Silo_Department").subscribe((department: any) => {
                this.departmentList = department.data;
                // Find silo department ID
                const siloDept = this.departmentList.find(
                    dept => dept.name.toLowerCase().includes('silo')
                );
                if (siloDept) {
                    this.currentDepartmentId = siloDept.id;
                }
                // ('Received department data:', department);
            }),
            this.socketService.listen("error").subscribe((error: any) => {
                this.toaster.error(error.message);
            })
        );
    }
    getAllData(): void {
        this.socketService.emit('silos-dpt:all', {});
    }
    getMastApprovalList(): void {
        this.socketService.emit('ms-approval-status:all', {});
    }
    getMastApproval(): void {
        this.socketService.emit('ms-approval-status:all', {});
    }
    openForm(): void {
        if (!this.isEditDepartment) {
            this.DepartmentForm.reset();
        }
        this.openButton?.nativeElement?.click();
    }
    closeForm(): void {
        this.DepartmentForm.reset();
        this.isEditDepartment = false;
        this.editDeparmentId = 0;
        this.closeButton?.nativeElement?.click();
    }
    editData(silDId: number, EntryId: number): void {
        this.router.navigate(['/pages/edit-silos-department/', silDId], { queryParams: { EntryId } });
    }
    updateStatus(sDepartmentId: any, departmentApproval: number): void {
        this.socketService.emit('approval:change-destination-approval-status', { status: departmentApproval, id: sDepartmentId });
    }
    getRowClass(row: any): string {
        // Assuming 'departmentApproval' is the correct property to check for approval status
        return row.departmentApproval === 3 ? 'approved-row' : '';
    }
    goToInfo(): void {
        this.router.navigate(['/pages/silo-info']);
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Rejected Quantity', 'Distributed Quantity', 'Manager Name', 'Manager Approval']
        csvData.push(headers.join(','));
        this.silosdata.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                row.entryTypeName,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                row.productName,
                `${row.qty} ${row.unitShortName}`,
                row.rejected_quantity,
                `${row.QtysiloBox} ${row.unitShortName}`,
                row.Name,
                //ow.sidStatus == "0" ? "Deactive" : "Active", // Dynamically show status
                row.appmangerName
            ];
            csvData.push(rowData.join(','));
        });
        const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link)
            ;
        link.click();
        document.body.removeChild(link)
            ;
    }
    printFile() {
        const headers = ['Sr. No', ' Entry Type', 'Date', 'Product', 'Quantity', 'Rejected Quantity', 'Distributed Quantity', 'Manager Name', 'Manager Approval']
        this.printService.print(headers, this.silosdata, (row, index) => [
            (index + 1).toString(),
            row.entryTypeName,
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            row.productName,
            `${row.qty} ${row.unitShortName}`,
            row.rejected_quantity,
            `${row.QtysiloBox} ${row.unitShortName}`,
            row.Name,
            //row.sidStatus == "0" ? "Deactive" : "Active", // Dynamically show status
            row.appmangerName
        ]);
    }
    GoToInventory() {
        if (this.currentDepartmentId) {
            // Navigate with the department ID
            this.router.navigate(['/pages/department-inventory', this.currentDepartmentId]);
        } else {
            // Fallback if department ID is not available
            this.toaster.error('Department ID not found');
        }
    }
    acceptStockListner() {
        this.subscriptions.push(
            this.socketService.listen("stock-info:accept-stock").subscribe((res: any) => {
                if (res?.success) {
                    this.toaster.success(res.message);
                    return;
                }
                this.toaster.error(res.message)
                if (res.error == 402) {
                    this.router.navigate(['/login']);
                    return
                }
            })
        );
    }
    acceptStock(entryId: number) {
        this.socketService.emit("stock-info:accept-stock", { id: entryId });
    }
    openQuantityModal(row: any) {
        if (row.admin_table_id) {
            this.socketService.emit("common:admin-return-details", { id: row.admin_table_id })
        }
        // console.log("curret row details =>", row)
        this.selectedRow = row;
    }
}

