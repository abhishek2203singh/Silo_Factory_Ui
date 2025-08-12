import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InfoPanelsComponent, InfoPanelData } from '../../dashboard/info-panels/info-panels.component';
import { PrintService } from '@services/print.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgToggleModule } from 'ng-toggle-button';
declare var $: any; // For jQuery modal

@Component({
    selector: 'app-stock-department',
    standalone: true,
    imports: [InfoPanelsComponent, NgxDatatableModule, CommonModule, ReactiveFormsModule, NgToggleModule],
    templateUrl: './stock-department.component.html',
    styleUrl: './stock-department.component.scss'
})
export class StockDepartmentComponent implements OnInit {
    @ViewChild(DatatableComponent) table!: DatatableComponent;
    selectedRow: any = null;

    editing: any = {};
    infoPanels: InfoPanelData[] = [];
    tempStock: any[] = [];
    tempEcomm: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    stockdeprt: any[] = [];
    ecommdeprt: any[] = [];
    id: [''];
    isEditMode: boolean = false;
    stockForm: FormGroup;
    SendQtyForm: FormGroup;
    entryList: any[] = [];
    eUsrList: any[] = [];
    productList: any[] = [];
    stockdeprtData: any[] = [];
    unitList: any[] = [];
    packingUnit: any[] = [];
    departmentList: any[] = [];
    departmentheadList: any[] = [];
    editUserId: number = 0;
    editEdprtId: number = 0;
    rows: any[] = [];
    latestEntryTimestamp: Date | null = null;
    ecommForm: FormGroup;
    currentDepartmentId: number;

    selection: SelectionType;
    @ViewChild("closeButton") closeButton: ElementRef | undefined;


    constructor(private socketService: SocketService, private toaster: ToastrService, private fb: FormBuilder, private printService: PrintService, private router: Router, private datePipe: DatePipe) {
        this.stockForm = this.fb.group({
            entryType: ['', Validators.required],
            productId: ['', Validators.required],
            unitId: ['', Validators.required],
            quantity: ['', [Validators.required, Validators.min(1)]],
            packingSizeId: ['', Validators.required],
            departmentId: ['', Validators.required],
            departmentHead: ['', Validators.required],
            id: ['']
        });
        this.ecommForm = this.fb.group({
            entryType: ['4'],
            productId: ['', Validators.required],
            quantity: ['', [Validators.required, Validators.min(1)]],
            // unitId: ['', Validators.required],
            // weightPerUnit: ['', Validators.required],
            masterPckSizeUnit: ['', Validators.required],
            pricePerUnit: ['', Validators.required],
            ecommerceUserId: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.getAllEcommUsrData();
        this.getAllStock();
        this.getStock();
        this.deleteDataListen();
        this.deleteEcommDataListen();
        this.loadProductsListen()
        this.loadProducts()
        this.loadDepartments();
        this.getentry();
        this.loadUnitsListen();
        this.loadUnits()
        this.getAllEcommData();
        this.updateDetailsListen();
        this.acceptStockListener();


        this.socketService.listen('approval:change-destination-approval-status').subscribe((res: any) => {
            // console.log('approval:change', res);
            if (res?.success) {
                this.toaster.success(res.message)
                this.getAllStock();
                return
            }
            this.toaster.error(res.message)
        });

        this.socketService.listen("ecommerce-dpt:update").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success("update quality", res.message);
                this.ecommForm.reset();
            } else {
                this.toaster.error(res.message);
            }
        });

        this.socketService.listen("error").subscribe((res: any) => {

            this.toaster.error(res.message);

        });

        this.socketService.listen('ecommerce-user:all').subscribe((res: any) => {
            if (res.success) {
                this.eUsrList = res.data;
                // // console.log("ecommdata", this.eUsrList);
            }
        });

        this.socketService.listen('ecommerce-dpt:all').subscribe((res: any) => {
            if (res?.success) {
                this.ecommdeprt = res.data;
                this.tempEcomm = [...this.ecommdeprt];
                // console.log("ecommdata", this.tempEcomm);
            }
        });

        this.socketService.listen('ecommerce-dpt:add').subscribe((response: any) => {
            if (response.success) {
                this.toaster.success(response.message);
                this.ecommForm.reset();
                // this.isEditMode = false;
            } else {
                this.toaster.error(response.message);
            }
        });

        this.socketService.listen('ecommerce-dpt:get-data-by-id').subscribe((rowData: any) => {
            const data = rowData.data;
            // console.log("amit", data);

            let productId = data.prodId
            this.unitByProdId(productId)
            this.ecommForm.patchValue({
                ecommerceUserId: Number(data.EcommUid),
                entryType: Number(data.EntryId),
                productId: Number(data.prodId),
                quantity: Number(data.qty),
                unitId: Number(data.unitId),
                masterPckSizeUnit: Number(data.masterPckSizeUnit),
                pricePerUnit: Number(data.priceper_unit),
            });
        });

        this.socketService.listen('stock-dpt:by-id').subscribe((rowData: any) => {
            if (rowData.success) {
                const data = rowData.data;
                // console.log("fudsfhdsfhidshf", data);

                this.stockForm.patchValue({
                    entryType: Number(data.entry_type_id),
                    productId: Number(data.product_id),
                    quantity: Number(data.quantity),
                    unitId: Number(data.unit_id),
                    packingSizeId: Number(data.master_packing_size_id),
                    departmentId: Number(data.department_id),
                    departmentHead: Number(data.departmenthead_id),
                    id: Number(data.id)
                });
                const departmentHeadId = data.department_id
                this.departmentHead(departmentHeadId)
                const productId = data.product_id
                this.unitByProdId(productId)
            } else {
                this.toaster.error(rowData.message)
            }

        });

        this.socketService.listen('stock-dpt:add').subscribe((response: any) => {
            if (response.success) {
                this.toaster.success(response.message);
                this.stockForm.reset();
                this.isEditMode = false;
            } else {
                this.toaster.error(response.message);
            }
        });

        this.socketService.listen("department:head").subscribe((response: any) => {
            if (response.success) {
                this.departmentheadList = response.data;
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });

        this.socketService.listen("ms-entry-type:all").subscribe((vendor: any) => {
            if (vendor.success) {
                this.entryList = vendor.data;
            } else {
                this.toaster.error(vendor.message);
            }
        });

        this.socketService.listen("department:all").subscribe((department: any) => {
            if (department.success) {
                this.departmentList = department.data;
                // Find stock department ID
                const stockDept = this.departmentList.find(
                    dept => dept.name.toLowerCase().includes('stock')
                );
                if (stockDept) {
                    this.currentDepartmentId = stockDept.id;
                }
                // ('Received department data:', department);
            } else {
                this.toaster.error(department.message);
                if (department.error === 402) {
                    this.socketService.Logout();
                }
            }
        });


    }

    acceptStockListener() {
        this.socketService.listen("stock-info:accept-stock").subscribe((res: any) => {
            if (res?.success) {
                this.toaster.success(res.message);
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })
    }

    openSendQtyForm(sdId: number) {
        const tabElement = document.querySelector('a[href="#tdropdown3"]') as HTMLAnchorElement;
        if (tabElement) {
            tabElement.click();
            this.socketService.emit('stock-dpt:by-id', { id: sdId });
        }
    }

    //   accept stock 
    acceptStock(id: number) {
        // console.log("accept stock id =>", id)
        this.socketService.emit("stock-info:accept-stock", { id })
    }

    getAllEcommUsrData() {
        this.socketService.emit('ecommerce-user:all', {});
    }
    private countDemandItems(): number {
        return this.stockdeprt.filter(item => item.entryTypeName === "Demand").length;
    }
    private countApprovalStatus(): number {
        return this.stockdeprt.filter(item => item.approvalname === "In Pending").length;
    }
    private countStockIn(): number {
        return this.stockdeprt.filter(item => item.entryTypeName === "Stock IN").length;
    }
    private countActive(): number {
        return this.stockdeprt.filter(item => item.sdStatus == "1").length;
    }
    private countDeactive(): number {
        return this.stockdeprt.filter(item => item.sdStatus == "0").length;
    }
    private updateInfoPanels(): void {
        const totalEntries = this.stockdeprt.length;
        const totalDemand = this.countDemandItems();
        const pendingApproval = this.countApprovalStatus();
        const totalStock = this.countStockIn();
        const totalActive = this.countActive();
        const totalDeactive = this.countDeactive();

        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Entries of Demand', value: totalDemand, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
            { name: 'Entries of Stock (IN)', value: totalStock, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
            { name: 'Pending Approval', value: pendingApproval, icon: 'fa fa-circle-o-notch', color: '#378D3B', format: 'number' },
            { name: 'Total Active', value: totalActive, icon: 'fa fa-check-circle', color: '#F47B00', format: 'number' },
            { name: 'Total Deactive', value: totalDeactive, icon: 'fa fa-ban', color: '#D22E2E', format: 'number' },
        ];
    }
    loadProductsListen() {
        this.socketService.listen("products:by-product-type").subscribe((product: any) => {
            this.productList = product.data;
        })
    }

    loadProducts() {
        this.socketService.emit("products:by-product-type", { id: 3 });
    }

    // get Packing size Unit Id 
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
            this.packingUnit = [];
        }

        this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
            this.packingUnit = unit.data;
            // console.log("hgdued", this.packingUnit);
        })
    }

    loadDepartments() {
        this.socketService.emit("department:all", {});
    }

    getentry() {
        this.socketService.emit("ms-entry-type:all", {});
    }

    loadUnitsListen() {
        this.socketService.listen("ms-unit:all").subscribe((unit: any) => {
            if (unit.success) {
                this.unitList = unit.data;
            } else {
                this.toaster.error(unit.message);
                if (unit.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
    }

    loadUnits() {
        this.socketService.emit("ms-unit:all", {});
    }

    departmentHead(departmentInput: Event | number) {
        let departmentId: number;
        if (typeof departmentInput === 'number') {
            departmentId = departmentInput;
        } else {
            const target = departmentInput.target as HTMLSelectElement;
            departmentId = Number(target.value);
        }

        if (!isNaN(departmentId) && departmentId !== 0) {
            this.socketService.emit("department:head", { department_id: departmentId, role_id: [11, 3] });
        } else {
            this.departmentheadList = [];
        }
    }

    closeForm() {
        this.stockForm.reset();
        this.isEditMode = false;
        this.editUserId = 0;
        this.closeButton?.nativeElement?.click();
    }

    editProduct(sdId: number): void {
        this.isEditMode = true;
        this.editUserId = sdId;
        this.socketService.emit('stock-dpt:by-id', { id: sdId });
    }

    editEcommDprt(id: number): void {
        this.isEditMode = true;
        this.editEdprtId = id;
        this.socketService.emit('ecommerce-dpt:get-data-by-id', { id });
    }

    updateDetailsListen() {
        this.socketService.listen("stock-dpt:update").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success("update quality", res.message);
                this.stockForm.reset();
            } else {
                this.toaster.error(res.message);
            }
        });
    }

    updateDetails() {
        if (this.stockForm.valid) {
            const data = { ...this.stockForm.value };
            this.socketService.emit("stock-dpt:update", data);
        }
    }

    updateEcommDprt() {
        if (this.ecommForm.valid) {
            // debugger
            const data = { ...this.ecommForm.value, id: this.editEdprtId };
            this.socketService.emit("ecommerce-dpt:update", data);
        }
    }

    getStock() {
        this.socketService.listen('stock-dpt:all').subscribe((res: any) => {
            if (res?.success) {
                // // console.log("hitted =>", res.data)
                this.stockdeprtData = res?.data
                this.tempStock = [...this.stockdeprtData]
                // console.log('stock data', this.stockdeprtData)
                // this.toaster.success(res.message)
                // this.updateInfoPanels();
            }
        });
        // broadcast
        this.socketService.listen('Stock_Department').subscribe((res: any) => {
            if (res?.success) {
                // // console.log("hitted =>", res.data)
                this.stockdeprtData = res?.data
                this.tempStock = [...this.stockdeprtData]
                // console.log('stock data', this.stockdeprtData)
                // this.toaster.success(res.message)
                // this.updateInfoPanels();
            }
        });
    }

    updateFilterStock(event: any) {
        const val = event.target.value.toLowerCase();
        // filter our data
        const filteredData = this.tempStock.filter((item: any) => {
            // Create separate status check
            const statusMatch1 = val === 'active' ? item.sdStatus === 1 :
                val === 'deactive' || val === 'deact' ? item.sdStatus === 0 :
                    false;

            return (
                // Basic information
                (item.entryTypeName?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.sDepartdate, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                // Product related
                (item.productName?.toLowerCase().includes(val)) ||
                (item.weight?.toLowerCase().includes(val)) ||
                (item.packing_size?.toString().toLowerCase().includes(val)) ||
                (item.st_name?.toLowerCase().includes(val)) ||

                // Quantity and Price
                (item.qty?.toString().toLowerCase().includes(val)) ||
                (item.unit_name?.toLowerCase().includes(val)) ||
                (item.priceper_unit?.toString().toLowerCase().includes(val)) ||

                // Department related
                (item.departmentName?.toLowerCase().includes(val)) ||
                (item.departmentHeadName?.toLowerCase().includes(val)) ||

                // Approval related
                (item.approvalname?.toLowerCase().includes(val)) ||
                (item.appmangerName?.toLowerCase().includes(val)) ||
                statusMatch1 || // Use the new status matching logic
                !val
            );
        });

        // update the rows
        this.stockdeprtData = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
    getAllStock() {
        this.socketService.emit('stock-dpt:all', {});
    }
    getAllEcommData() {
        this.socketService.emit('ecommerce-dpt:all', {});
    }
    deleteDataListen() {
        this.socketService.listen('stock-dpt:delete').subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
            } else {
                this.toaster.error(res.message);
            }
        });
    }
    deleteEcommDataListen() {
        this.socketService.listen('ecommerce-dpt:delete').subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
            } else {
                this.toaster.error(res.message);
            }
        });
    }
    deleteEcommData(eDId: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Emit WebSocket event to delete product by ID
                this.socketService.emit('ecommerce-dpt:delete', { id: eDId })
            }
        });
    }
    deleteData(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Deactivate it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.socketService.emit('stock-dpt:delete', { id })
            }
        });
    }
    onSubmit() {
        if (this.stockForm.valid) {
            const formData = { ...this.stockForm.value };
            this.socketService.emit('stock-dpt:add', formData);
        } else {
            this.toaster.warning('Please fill all required fields.');
        }
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Rejected Quantity', 'Packaging Size', 'Department', 'Department Head', 'Status'];
        csvData.push(headers.join(','));
        this.stockdeprtData.forEach((row, index) => {
            const rowData = [
                (index + 1).toString(),
                row.entryTypeName,
                new Date(row.sDepartdate).toLocaleDateString(),  // Formatted date
                row.productName,
                `${row.qty} ${row.unitShortName}`,
                `${row.rejected_quantity} ${row.unitShortName}`,
                `${row.weight} ${row.unitShortName}`,
                row.departmentName,
                row.departmentHeadName,
                row.sdStatus == "0" ? "Deactive" : "Active",
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
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Rejected Quantity', 'Packaging Size', 'Department', 'Department Head', 'Status'];
        this.printService.print(headers, this.stockdeprtData, (row, index) => [
            (index + 1).toString(),
            row.entryTypeName,
            new Date(row.sDepartdate).toLocaleDateString(),  // Formatted date
            row.productName,
            `${row.qty} ${row.unitShortName}`,
            `${row.rejected_quantity} ${row.unitShortName}`,
            `${row.weight} ${row.unitShortName}`,
            row.departmentName,
            row.departmentHeadName,
            row.sdStatus == "0" ? "Deactive" : "Active",
        ]);
    }
    gotoView() {
        this.router.navigate(['/pages/send-return-distribution-center']);
    }
    onEcommSubmit() {
        if (this.ecommForm.valid) {
            const formData = { ...this.ecommForm.value };
            this.socketService.emit('ecommerce-dpt:add', formData);
        } else {
            this.toaster.warning('Please fill all required fields.');
        }
    }
    updateFilterEcomm(event1: any) {
        const val1 = event1.target.value.toLowerCase();

        // filter our data
        const filteredData2 = this.tempEcomm.filter((item1: any) => {
            // const statusText2 = item1.edStatus === 1 ? 'active' : 'deactive';
            // Create separate status check
            const statusMatch2 = val1 === 'active' ? item1.edStatus === 1 :
                val1 === 'deactive' || val1 === 'deact' ? item1.edStatus === 0 :
                    false;
            return (
                // Basic information
                (item1.entryTypeName?.toLowerCase().includes(val1)) ||
                (this.datePipe.transform(item1.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val1)) ||
                // Product related
                (item1.EcommUsrName?.toLowerCase().includes(val1)) ||
                (item1.productName?.toString().toLowerCase().includes(val1)) ||
                (item1.weight_per_unit?.toString().includes(val1)) ||
                // Quantity and Price
                (item1.qty?.toString().includes(val1)) ||
                (item1.priceper_unit?.toString().includes(val1)) ||
                // Approval related
                (item1.approvalStatusName?.toLowerCase().includes(val1)) ||
                statusMatch2 || // Use the new status matching logic
                !val1
            );
        });

        // update the rows
        this.ecommdeprt = filteredData2;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
    exportToEcommCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Ecommerce User', 'Product', 'Packing Size', 'Price', 'Quantity', 'Rejected Quantity', 'Total', 'Approval Name', 'Status'];
        csvData.push(headers.join(','));
        this.tempEcomm.forEach((row, index) => {
            const rowData = [
                index + 1,
                row.entryTypeName,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                row.EcommUsrName,
                row.productName,
                `${row.weight_per_unit
                } ${row.unitShortName}`,
                row.priceper_unit,
                `${row?.qty * row.priceper_unit}`,
                `${row.rejected_quantity} ${row.unitShortName}`,
                `₹${row?.qty * row.priceper_unit}`,
                row.approvalStatusName,
                row.edStatus == "0" ? "Deactive" : "Active",
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
    printEcommFile() {
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Ecommerce User', 'Product', 'Packing Size', 'Price', 'Quantity', 'Rejected Quantity', 'Total', 'Approval Name', 'Status'];
        this.printService.print(headers, this.tempEcomm, (row, index) => [
            (index + 1).toString(),
            row.entryTypeName,
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            row.EcommUsrName,
            row.productName,
            `${row.weight_per_unit
            } ${row.unitShortName}`,
            row.priceper_unit,
            `${row?.qty * row.priceper_unit}`,
            `${row.rejected_quantity} ${row.unitShortName}`,
            `₹${row?.qty * row.priceper_unit}`,
            row.approvalStatusName,
            row.edStatus == "0" ? "Deactive" : "Active",
        ]);
    }
    gotoSend(sdId: number) {
        this.router.navigate(['/pages/send-quantity/' + sdId]);
        this.socketService.emit('stock-dpt:by-id', { id: sdId });

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
    updateStatus(sdId: any, departmentApproval: number): void {
        this.socketService.emit('approval:change-destination-approval-status', { status: departmentApproval, id: sdId });
    }
    getRowClass(row: any): string {
        // Assuming 'departmentApproval' is the correct property to check for approval status
        return row.departmentApproval === 3 ? 'approved-row' : '';
    }
    toggleStatus(row: any) {
        // Prevent action if status is 0
        if (row.status === 0) {
            return;
        }

        // Toggle the `isToggled` state
        row.isToggled = !row.isToggled;

        // Call your function for toggling status (e.g., deleteData or another action)
        this.deleteData(row.sdId);
    }
    openEccomModal(row: any) {
        this.selectedRow = row;
        $('#stockInfoModal').modal('show');
    }

    openStockModal(row: any) {
        this.selectedRow = row;
        $('#stockInfoModal').modal('show');
    }

}