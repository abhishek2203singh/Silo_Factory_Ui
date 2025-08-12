import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType, } from '@swimlane/ngx-datatable';
// import { InfoCardsComponent } from '../dashboard/info-cards/info-cards.component';
// import { VisitorsComponent } from '../dashboard/visitors/visitors.component';
// import { CostComponent } from '../dashboard/cost/cost.component';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PrintService } from '@services/print.service';
import Swal from 'sweetalert2';
import { NgToggleModule } from 'ng-toggle-button';
import { InfoPanelData, InfoPanelsComponent } from '../dashboard/info-panels/info-panels.component';
import { Subscription } from 'rxjs';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from '@services/utility.service';
declare var $: any; // For jQuery modal
@Component({
    selector: 'app-distribution-center',
    standalone: true,
    imports: [InfoPanelsComponent, NgxDatatableModule, ReactiveFormsModule, NgToggleModule,
        CommonModule, FormsModule, NgbTimepickerModule],
    templateUrl: './distribution-center.component.html',
    styleUrl: './distribution-center.component.scss'
})
export class DistributionCenterComponent implements OnInit {
    @ViewChild('createScheduleModal') createScheduleModal: ElementRef;
    editing: any = {};
    currentDepartmentId: number;
    selectedRow: any = null;
    infoPanels: InfoPanelData[] = [];
    defaultTime: Time = { hour: '06', minute: '30', second: '00' }
    roleId: number;
    rows: any[] = [];
    temp: any[] = [];
    namesList: any[] = [];
    unitList: any[] = [];
    productList: any[] = [];
    iddata: any;
    Id: any;
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    distributionCenterForm: FormGroup
    scheduleTimeForm: FormGroup
    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    distributionData: any[] = [];
    socketService = inject(SocketService);
    toaster = inject(ToastrService);
    fb = inject(FormBuilder)
    router = inject(Router)
    stockOutData: any;
    returnData: any;
    dispatchedQuantity?: number;
    isReturnMode: boolean = false;
    Return() {
        this.isReturnMode = true;
    }
    AddStock() {
        this.isReturnMode = false;
    }
    private subscriptions: Subscription[] = [];
    constructor(private printService: PrintService, private datePipe: DatePipe, private modalService: NgbModal, protected util: UtilityService) {
        this.distributionCenterForm = this.fb.group({
            entryType: [2, [Validators.required, Validators.min(1)]],
            productId: [0, [Validators.required, Validators.min(1)]],
            quantity: ['', [Validators.required, Validators.min(1)]],
            masterPckSizeUnit: [0, [Validators.required, Validators.min(1)]],
            priceperUnit: ['',],
            message: ['',],
            id: ['']
        });



        this.scheduleTimeForm = this.fb.group({
            time: [{
                hour: parseInt(this.defaultTime.hour, 10),
                minute: parseInt(this.defaultTime.minute, 10),
                second: parseInt(this.defaultTime.second, 10)
            }, Validators.required],
            minBalance: [null, [
                Validators.required,
                Validators.min(1),
                Validators.pattern(/^\d+$/) // Ensure only positive integers
            ]]
        });
        this.currentDepartmentId = this.util.getCurrentUser().departmentId;
    }
    ngOnInit(): void {
        const sub = this.socketService.listen("error").subscribe((error: any) => {
            this.toaster.error(error.message);
        });
        this.getlogedInuserData()
        this.returnProductListen()
        this.returnProducts()
        this.getEntryType()
        this.getAllentryTypes()
        this.loadProductsListen()
        this.loadProducts()
        this.getAllDataListen()
        this.getAllData()
        this.onSubmitListen()
        this.editDataListen()
        this.updateDistributionListen()
        this.changeDeleteStatusListen()
        this.returnStockItemListen()
        this.listenAdmiReturn();
        this.onTimeSubmitListen();
        this.acceptEntryListen();
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
    acceptEntryListen() {
        this.socketService.listen('stock-info:accept-stock').subscribe((res: any) => {
            if (res?.success) {
                // First show the success message
                this.toaster.success(res.message);
                // Then show the dispatched quantity if it exists
                if (res.dispatchedQuantity !== undefined) {
                    Swal.fire({
                        title: 'Dispatched Quantity',
                        text: `The dispatched quantity is: ${res.dispatchedQuantity}`,
                        icon: 'info',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'OK'
                    });
                }
            } else {
                this.toaster.error(res.message);
            }
        });
    }
    entryType: any[] = [];
    getAllentryTypes() {
        this.socketService.listen('ms-entry-type:all').subscribe((res: any) => {
            if (res?.success) {
                this.entryType = res.data;
            }
        })
    }
    getEntryType() {
        this.socketService.emit('ms-entry-type:all', {})
    }
    loadProductsListen() {
        this.socketService.listen("products:by-product-type").subscribe((product: any) => {
            this.namesList = product.data;
        })
    }
    loadProducts() {
        this.socketService.emit("products:by-product-type", { id: 3 });
    }
    getAllDataListen() {
        this.socketService.listen("distribution-dpt:get").subscribe((res: any) => {
            if (res.success) {
                this.distributionData = res.data;
                this.temp = [...this.distributionData]
                this.updateInfoPanels();
            } else {
                this.toaster.error(res.message)
            }
        })
    }

    returnProductListen() {
        this.socketService.listen("stock-info:product-list").subscribe((res: any) => {
            this.productList = res.data
        })
    }

    returnProducts() {
        this.socketService.emit("stock-info:product-list", {})

    }
    PackagingList: any[] = [];
    packagingByProdId(newInput: Event | any) {
        let id: number;
        if (typeof newInput === "number") {
            id = newInput;
        } else {
            const target = newInput.target as HTMLSelectElement;
            id = Number(target.value);
        }
        // console.log("productId:", id);
        if (!isNaN(id) && id > 0) {
            this.socketService.emit("stock-info:packing-size", { id });
        } else {
            this.PackagingList = [];
        }
        this.socketService.listen("stock-info:packing-size").subscribe((unit: any) => {
            // console.log("Packaging List:", unit);
            if (unit && unit.data) {
                this.PackagingList = unit.data;
            } else {
                this.PackagingList = [];
            }
        });
    }
    unitByProdId(newInput: Event | any) {
        let productId: number
        if (typeof newInput === "number") {
            productId = newInput
        } else {
            const target = newInput.target as HTMLSelectElement
            productId = Number(target.value)
        }
        if (!isNaN(productId) && productId !== 0) {
            this.socketService.emit("ms-packing-size:by-product-id", { productId: productId });
        } else {
            this.unitList = [];
        }
        this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
            this.unitList = unit.data;
            // // console.log("hgdued", this.unitList);
        })
    }
    getAllData() {
        this.socketService.emit("distribution-dpt:get", {})
    }
    onSubmitListen() {
        this.socketService.listen("distribution-dpt:add").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
                this.distributionCenterForm.reset({
                    productId: 0, entryType: 2,
                    masterPckSizeUnit: 0
                });
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    editDataListen() {
        this.socketService.listen("distribution-dpt:get-byId").subscribe((res: any) => {
            if (res.success) {
                const byidData = res.data;
                let entryType = byidData.entry_type_id;
                let productId = byidData.product_id;
                let quantity = byidData.quantity;
                let masterPckSizeUnit = byidData.master_packing_size_id;
                let id = byidData.id;
                this.unitByProdId(productId);
                this.distributionCenterForm.patchValue({ id, entryType, productId, quantity, masterPckSizeUnit });
                this.toaster.success(res.message);
            } else {
                this.toaster.error(res.message);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    editData(id: number) {
        this.isReturnMode = false;
        this.iddata = id;
        this.socketService.emit("distribution-dpt:get-byId", { id })
    }
    onSubmit() {
        const formData = this.distributionCenterForm.value;
        if (this.distributionCenterForm.valid) {
            this.socketService.emit("distribution-dpt:add", formData)
        }
        else {
            this.toaster.warning('Please fill all required fields.')
        }
    }
    onTimeSubmit(): void {
        // console.log("schedult form =>", this.scheduleTimeForm.value)
        if (this.scheduleTimeForm.valid) {
            const { time, minBalance } = this.scheduleTimeForm.value;
            // console.log("Time data sent:", time, "Minimum balance:",);
            $('#CreateSchedul').modal('hide');
            // Directly access minimum_balance from the form data
            Swal.fire({
                title: "are you sure to process this request !",
                text: ` scheduling time : ${time.hour}:${time.minute} & customer minimum balance should be ${minBalance} to perform scheduling `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
            }).then((result) => {
                if (result.isConfirmed) {
                    // {hour: 1, minute: 10, second: 0}
                    this.socketService.emit("distribution-dpt:time-scheduler", { time: `${time.hour}:${time.minute}`, minBalance });
                } else {
                    $('#CreateSchedul').modal('show');
                }
            })



        } else {
            this.toaster.warning('Please fill all required fields.');
        }
    }
    private padTime(time: number): string {
        return time < 10 ? `0${time}` : `${time}`;
    }
    onTimeSubmitListen(): void {
        this.socketService.listen("distribution-dpt:time-scheduler").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
                // console.log("minimum_balance :", res);
                this.scheduleTimeForm.reset({
                    time: {
                        hour: parseInt(this.defaultTime.hour, 10),
                        minute: parseInt(this.defaultTime.minute, 10),
                        second: parseInt(this.defaultTime.second, 10)
                    },
                    minBalance: 100
                });
            } else {
                this.toaster.error(res.message);
            }
        });
    }
    closeModal(): void {
        // If using NgbModal
        if (this.createScheduleModal) {
            this.modalService.dismissAll();
        }
        // If using jQuery or standard Bootstrap
        $('#CreateSchedul').modal('hide');
    }
    updateDistributionListen() {
        this.socketService.listen("distribution-dpt:update").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
                this.distributionCenterForm.reset({
                    entryType: 2,
                    productId: 0,
                    masterPckSizeUnit: 0
                });
                this.iddata = 0
            } else {
                this.toaster.error(res.message);
            }
        })
    }
    updateDistribution() {
        const formData = this.distributionCenterForm.value;
        // formData.id = this.iddata; // Add the id to the form data
        this.socketService.emit("distribution-dpt:update", formData)
    }
    fetch(data: any) {
        const req = new XMLHttpRequest();
        req.open('GET', 'data/company.json');
        req.onload = () => {
            data(JSON.parse(req.response));
        };
        req.send();
    }
    updateValue(event: any, cell: any, cellValue: any, row: any) {
        this.editing[row.$$index + '-' + cell] = false;
        this.rows[row.$$index][cell] = event.target.value;
    }
    getlogedInuserData() {
        const authData = localStorage.getItem('user')
        if (authData) {
            const newData = JSON.parse(authData);
            this.roleId = newData.roleId;
        }
    }
    goToRetailCreation() {
        this.router.navigate(['/pages/create-retail-user'])
    }
    changeDeleteStatusListen() {
        this.socketService.listen("distribution-dpt:delete-by-id").subscribe((res: any) => {
            if (res.success) {
                Swal.fire("Deactivate user", res.message, "success");
                return;
            }
            Swal.fire("Deactivate user", res.message, "error");
        })
    }
    changeDeleteStatus(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: `You won't be able to revert this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, deactivate it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Listen for the response from the server
                this.socketService.emit("distribution-dpt:delete-by-id", { id: id })
            }
        });
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Type', 'Product', 'Date', 'Quantity', 'Rejected Quantity', `Packaging Unit`, `Manager Apporval Status`, `Destination Apporval Status`, 'Status'];
        csvData.push(headers.join(','));
        this.distributionData.forEach((row, index) => {
            const rowData = [
                index + 1,
                row.entryTypeName,
                row.productName,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                `${row.quantity}${row.unitShortName}`,
                `${row.rejected_quantity}${row.unitShortName}`,
                `${row.weight} ${row.unitShortName}`,
                row.appmangerName,
                row.approvalname,
                row.status == "0" ? "Deactive" : "Active",
            ];
            csvData.push(rowData.map(item => `"${item}"`).join(','));
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
        const headers = ['Sr. No', 'Entry Type', 'Product', 'Date', 'Quantity', 'Distributed Quantity', 'Rejected Quantity', `Packaging Unit`, `Manager Approval`, 'Status'];
        this.printService.print(headers, this.distributionData, (row, index) => [
            (index + 1).toString(),
            row.entryTypeName,
            row.productName,
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            `${row.quantity}${row.unitShortName}`,
            `${row.distributed_quantity}${row.unitShortName}`,
            `${row.rejected_quantity}${row.unitShortName}`,
            `${row.weight_packing} ${row.weight_packing_st_name}`,
            row.appmangerName,
            row.status == "0" ? "Deactive" : "Active",
        ]);
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // Filter the data based on the search input
        const filteredData = this.temp.filter((item: any) => {
            // Create separate status check
            const statusMatch = val === 'active' ? item.status === 1 :
                val === 'deactive' || val === 'deact' ? item.status === 0 :
                    false;
            return (
                // Basic information
                (item.entryTypeName?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                // Product-related
                (item.EcommUsrName?.toLowerCase().includes(val)) ||
                (item.productName?.toLowerCase().includes(val)) ||
                (item.distCenterName?.toString().toLowerCase().includes(val)) ||
                (item.weight?.toString().toLowerCase().includes(val)) ||
                // Quantity and Unit Information
                (item.quantity?.toString().toLowerCase().includes(val)) ||
                // Manager and Approval Information
                (item.appmangerName?.toLowerCase().includes(val)) ||
                (item.approvalname?.toLowerCase().includes(val)) ||
                statusMatch || // Check against "active" or "deactive"
                !val
            );
        });
        // Update the displayed rows
        this.distributionData = filteredData;
        // Reset to the first page when the filter changes
        this.table.offset = 0;
    }
    gotoSend(id: number) {
        this.router.navigate(['/pages/dispatch-to-retail/' + id]);
    }
    returnStockItemListen() {
        this.socketService.listen("distribution-dpt:return").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
                this.distributionCenterForm.reset({
                    entryType: 2,
                    productId: 0,
                    masterPckSizeUnit: 0
                });
                this.isReturnMode = false;
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    returnStockItem() {
        if (this.distributionCenterForm.invalid) {
            Swal.fire({
                title: 'Incomplete Form',
                text: 'Please fill all required fields.',
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
            return;
        }

        const formData = this.distributionCenterForm.value;
        const selectedProduct = this.productList.find(product => product.product_id === +formData.productId) || { product_name: 'unknown product' };
        const selectedPackaging = this.PackagingList.find(pack => pack.packing_size_id === +formData.masterPckSizeUnit) || { weight: 'unknown weight', st_name: 'unknown unit' };

        const quantity = formData.quantity || 0;
        const productName = selectedProduct.product_name;
        const weight = selectedPackaging.weight;
        const stName = selectedPackaging.st_name;

        Swal.fire({
            title: `Are you sure you want to Return ${quantity} units of ${productName} with the packaging size of ${weight} ${stName}?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Return it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.socketService.emit("distribution-dpt:return", formData);
            }
        });
    }
    acceptEntry(row: any) {
        Swal.fire({
            title: 'Accept Stock Entry',
            text: `Are you sure you want to accept ${row.quantity} units of ${row.productName} with the packaging size of ${row.weight_packing} ${row.weight_packing_st_name
                }?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Accept Stock'
        }).then((result) => {
            if (result.isConfirmed) {
                this.socketService.emit("stock-info:accept-stock", { id: row.id });
                // console.log("result", row.id);
            }
        });
    }
    openQuantityModal(row: any) {
        // debugger
        if (row.admin_table_id) {
            this.socketService.emit("common:admin-return-details", { id: row.admin_table_id })
        }
        //console.log("curret row details =>", row)
        this.selectedRow = row;
    }
    private countItemsByEntryId(entryId: string): number {
        return this.distributionData.filter(item => item.EntryId == entryId).length;
    }
    private updateInfoPanels(): void {
        const totalEntries = this.distributionData.length;
        const totalQty = this.distributionData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const totalStockOut = this.countItemsByEntryId("4");
        const totalDemand = this.countItemsByEntryId("1");
        const totalStockIn = this.countItemsByEntryId("3");
        const totalRequest = this.countItemsByEntryId("2");
        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Total Quantity(Ltr) ', value: totalQty, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Entries of Request', value: totalRequest, icon: 'fa fa-table', color: '#378D3B', format: 'number' },
            { name: 'Entries of Demand', value: totalDemand, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
            { name: 'Entries of Stock (In)', value: totalStockIn, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
            { name: 'Entries of Stock (Out)', value: totalStockOut, icon: 'fa fa-sign-out', color: '#F47B00', format: 'number' },
        ];
    }
    time = { hour: 13, minute: 30 };
    spinners = true;
    GoToInventory() {
        if (this.util.getCurrentUser().departmentId) {
            // Navigate with the department ID
            this.router.navigate(['/pages/department-inventory', this.currentDepartmentId]);
        } else {
            // Fallback if department ID is not available
            this.toaster.error('Department ID not found');
        }
    }
}

type Time = {
    hour: string,
    minute: string,
    second: string
}