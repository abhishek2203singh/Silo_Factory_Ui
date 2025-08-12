import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { InfoPanelsComponent, InfoPanelData } from '../dashboard/info-panels/info-panels.component';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileUploaderComponent } from '../form-elements/controls/file-uploader/file-uploader.component';
import { Router } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';
import { BaseService } from '@services/Base.service';
import { PrintService } from '@services/print.service';
declare var $: any; // For jQuery modal
@Component({
    selector: 'app-packing-department',
    standalone: true,
    imports: [InfoPanelsComponent, NgxDatatableModule, CommonModule, ReactiveFormsModule],
    templateUrl: './packing-department.component.html',
    styleUrls: ['./packing-department.component.scss']
})
export class PackingDepartmentComponent implements OnInit {
    menuVisible = false;
    selectedRow: any = null;
    toggleMenu() {
        this.menuVisible = !this.menuVisible;
    }
    currentDepartmentId: number;
    productForm: FormGroup;
    blockForm: FormGroup;
    sendStockForm: FormGroup;
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    selection: SelectionType = SelectionType.checkbox;
    isFileUploading: boolean = false;
    uploadResult: any;
    baseImageUrl: string;
    namesList: any[] = [];
    unitList: any[] = [];
    departmentList: any[] = [];
    List: any[] = [];
    departmentheadList: any[] = [];
    baseImgUrl: string;
    defaultPic: string;
    previewImageUrl: string | undefined;
    showForm: boolean = false;
    infoPanels: InfoPanelData[] = [];
    requestId: any
    packdeprt: any[] = [];
    // New properties for send stock functionality
    isSendStockMode = false;
    selectedRowForSending: any = null;
    private socketService = inject(SocketService);
    private subscriptions: Subscription[] = [];
    isEditMode: boolean = false;
    editUserId: number = 0;
    user: any;
    toaster: any;
    constructor(private fb: FormBuilder, private router: Router, public toastr: ToastrService,
        private modalService: NgbModal, protected utilityServices: UtilityService,
        protected baseService: BaseService, private printService: PrintService, private datePipe: DatePipe) {
        this.blockForm = this.fb.group({
            entryType: [2, Validators.required],
            productId: [0, Validators.required],
            quantity: ["", [Validators.required, Validators.min(1)]],
            unitId: [0, Validators.required],
            departmentId: [0, Validators.required],
            departmentHead: [0, Validators.required],
        });
        // Initialize send stock form
        this.sendStockForm = this.fb.group({
            quantity: ['', [
                Validators.required,
                Validators.min(1),
                Validators.max(this.selectedRowForSending?.qty || 0)
            ]],
            destinationDepartment: [0, Validators.required],
            remarks: ['']
        });
        this.fetch((data: any) => {
            this.temp = [...data];
            this.rows = data;
            setTimeout(() => { this.loadingIndicator = false; }, 1500);
        });
    }
    @ViewChild(DatatableComponent) table: DatatableComponent;
    @ViewChild("closeButton") closeButton: ElementRef | undefined;
    close() {
        this.closeButton?.nativeElement.click();
    }
    ngOnInit() {
        this.getAllPackagingList();
        this.getAllData();
        this.getentry();
        this.loadProducts();
        this.loadDepartments();
        this.loadUnits();
        this.acceptStockListner();
        this.sendStockListen()
        this.socketService.listen('packaging-dpt:delete').subscribe((response: any) => {
            if (response.success) {
                Swal.fire(
                    'Deleted!',
                    'Your product has been deleted.',
                    'success'
                );
                this.fetch((data: any) => {
                    this.temp = [...data];
                    this.rows = data;
                    this.table.recalculate(); // Ensure the table is updated
                });
                return;
            }
            Swal.fire(
                'Error!',
                'There was an issue deleting the product.',
                'error'
            );
        })
        this.socketService.listen("ms-unit:all").subscribe((unit: any) => {
            if (unit.success) {
                this.unitList = unit.data;
            } else {
                this.toastr.error(unit.message);
                if (unit.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.socketService.listen("products:all").subscribe((product: any) => {
            if (product.success) {
                this.namesList = product.data;
            } else {
                this.toastr.error(product.message);
                this.loadingIndicator = false;
            }
        });
        this.socketService.listen("ms-entry-type:all").subscribe((vendor: any) => {
            if (vendor.success) {
                this.List = vendor.data;
            } else {
                this.toastr.error(vendor.message);
            }
        });
        this.socketService.listen("packaging-dpt:update").subscribe((res: any) => {
            if (res.success) {
                this.toastr.success("update quality", res.message);
                this.closeForm();
                this.fetch((data: any) => {
                    this.temp = [...data];
                    this.rows = data;
                    this.table.recalculate();
                });
            } else {
                this.toastr.error(res.message);
            }
        });
        this.socketService.listen('packaging-dpt:by-id').subscribe((rowData: any) => {
            const { data } = rowData;
            // this.socketService.emit("department:head", { department_id: Number(data.department_id) });
            this.blockForm.patchValue({
                entryType: Number(data.entry_type_id),
                productId: Number(data.product_id),
                quantity: Number(data.quantity),
                unitId: Number(data.unit_id),
                departmentId: Number(data.department_id),
                departmentHead: Number(data.departmenthead_id)
            });
            const departmentHeadId = data.department_id
            this.departmentHead(departmentHeadId)
        });
        const sub6 = this.socketService.listen("department:head").subscribe((response: any) => {
            if (response.success) {
                this.departmentheadList = response.data;
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub6);
        this.socketService.listen('packaging-dpt:add').subscribe((response: any) => {
            if (response.success) {
                this.toastr.success(response.message);
                this.blockForm.reset({
                    entryType: 0,
                    productId: 0,
                    unitId: 0,
                    departmentId: 0,
                    departmentHead: 0
                });
                this.isEditMode = false;
                //  this.getAllData()
            } else {
                this.toastr.error(response.message);
            }
        });
    }
    private countMilkItems(): number {
        return this.packdeprt.filter(item => item.productName === "milk").reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    }
    acceptStockListner() {
        this.socketService.listen("stock-info:accept-stock").subscribe((res: any) => {
            // // console.log("acceptStockListner =>", res)
            if (res?.success) {
                this.toastr.success(res.message);
                return;
            }
            this.toastr.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })
    }
    acceptStock(entryId: number) {
        Swal.fire({
            title: 'You are about to Stock In the given entry!',
            text: `You won't be able to revert this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, submit it!'
        }).then((result) => {
            {
                this.socketService.emit('stock-info:accept-stock', { id: entryId });
            }
        });
        // this.socketService.emit("stock-info:accept-stock", { id: entryId });
    }
    private countDemandItems(): number {
        return this.packdeprt.filter(item => item.entryTypeName === "Stock Out").length;
    }
    private countApprovalStatus(): number {
        return this.packdeprt.filter(item => item.approvalname === "Pending").length;
    }
    private countManagerApproved(): number {
        return this.packdeprt.filter(item => item.approvalname === "Approved").length;
    }
    private countStockIn(): number {
        return this.packdeprt.filter(item => item.entryTypeName === "Stock IN").length;
    }
    private countQuantity(): number {
        return this.packdeprt.filter(item => item.qty).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    }
    private updateInfoPanels(): void {
        const totalEntries = this.packdeprt.length;
        const totalquantity = this.countQuantity();
        const totalStockout = this.countDemandItems();
        const totalApproval = this.countApprovalStatus();
        const totalApproved = this.countManagerApproved();
        const totalStock = this.countStockIn();
        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Quantity Available(Ltr) ', value: totalquantity, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Entries of Stock Out', value: totalStockout, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
            { name: 'Entries of Stock (IN)', value: totalStock, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
            { name: 'Total Pending', value: totalApproval, icon: 'fa fa-circle-o-notch', color: '#378D3B', format: 'number' },
            { name: 'Total Approved', value: totalApproved, icon: 'fa fa-cube', color: '#F47B00', format: 'number' },
        ];
    }
    loadProducts() {
        this.socketService.emit("products:all", {});
    }
    loadDepartments() {
        this.socketService.emit("department:all", {});
        this.subscriptions.push(
            this.socketService.listen("department:all").subscribe((department: any) => {
                this.departmentList = department.data;
                // Find pasteurization department ID
                const packagingDept = this.departmentList.find(
                    dept => dept.name.toLowerCase().includes('packaging')
                );
                if (packagingDept) {
                    this.currentDepartmentId = packagingDept.id;
                }
                // ('Received department data:', department);
            })
        );
    }
    loadUnits() {
        this.socketService.emit("ms-unit:all", {});
    }
    fetch(data: any) {
        const req = new XMLHttpRequest();
        req.open('GET', 'data/company.json');
        req.onload = () => {
            data(JSON.parse(req.response));
        };
        req.send();
    }
    departmentHead(departmentInput: Event | number) {
        let departmentId: number;
        if (typeof departmentInput === 'number') {
            // departmentInput is departmentId (from getIdListen)
            departmentId = departmentInput;
        } else {
            // departmentInput is the event (from dropdown change)
            const target = departmentInput.target as HTMLSelectElement;
            departmentId = Number(target.value); // Convert the value to a number
        }
        if (!isNaN(departmentId) && departmentId !== 0) {
            // Emit WebSocket event with departmentId
            this.socketService.emit("department:head", { department_id: departmentId, role_id: [11, 3] });
        } else {
            // Clear the department head list if no valid departmentId
            this.departmentheadList = [];
        }
    }
    onSubmit() {
        if (this.blockForm.valid) {
            const formData = { ...this.blockForm.value };
            this.socketService.emit('packaging-dpt:add', formData);
        } else {
            this.toastr.warning('Please fill all required fields.');
        }
    }
    addProduct() {
        if (this.productForm.valid) {
            this.socketService.emit("product:insert", this.productForm.value);
            this.socketService.listen("product:insert").subscribe((response: any) => {
                if (response.success) {
                    this.toastr.success('Product submitted successfully!');
                    this.productForm.reset();
                    this.loadProducts();
                    this.close();
                    this.modalService.dismissAll();
                } else {
                    this.toastr.error('Failed to submit product!');
                }
            });
        } else {
            this.toastr.error('Please fill out the form correctly.');
        }
    }
    async uploadFile(file: any) {
        this.isFileUploading = true;
        this.uploadResult = await this.utilityServices.uploadImageUtility(file);
        // ("uploadResult =>", this.uploadResult);
        if (this.uploadResult.error) {
            Swal.fire("Something went wrong", "Unable to upload file!", 'warning');
            this.isFileUploading = false;
        } else {
            this.blockForm.patchValue({
                bill_image: this.uploadResult?.Filename ?? ""
            });
            // Assign the uploaded file name to the defaultPic variable
            this.defaultPic = this.uploadResult.Filename;
            // Reset the file uploading state
            this.isFileUploading = false;
        }
    }
    async uploadPrdctImg(file: any) {
        this.isFileUploading = true;
        this.uploadResult = await this.utilityServices.uploadImageUtility(file);
        // ("uploadResult =>", this.uploadResult)
        if (this.uploadResult.error) {
            Swal.fire("something went wrong", "unable to upload file !", 'warning');
            this.isFileUploading = false;
        }
        else {
            this.productForm.patchValue({
                product_image: this.uploadResult?.Filename ?? "",
            })
        }
    }
    closeForm() {
        this.blockForm.reset();
        this.isEditMode = false;
        this.editUserId = 0;
        this.closeButton?.nativeElement?.click();
    }
    editProduct(id: number): void {
        this.isEditMode = true;
        this.editUserId = id;
        this.socketService.emit('packaging-dpt:by-id', { id });
    }
    updateDetails() {
        if (this.blockForm.valid) {
            const data = { ...this.blockForm.value, id: this.editUserId };
            this.socketService.emit("packaging-dpt:update", data);
        }
    }
    deleteProduct(id: any): void {
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
                this.socketService.emit('packaging-dpt:delete', { id });
                // Listen for the response from the server
            }
        });
    }
    getAllData() {
        this.socketService.listen('packaging-dpt:all').subscribe((res: any) => {
            if (res?.success) {
                this.packdeprt = res.data;
                // console.log('Packaging', res.data);
                this.temp = [...this.packdeprt];
                this.updateInfoPanels();
            }
            // ("packaging", this.packdeprt)
        });
        // Broadcast 
        this.socketService.listen('Packaging_Department').subscribe((res: any) => {
            if (res?.success) {
                this.packdeprt = res.data;
                // console.log('Packaging', res.data);
                this.temp = [...this.packdeprt];
                this.updateInfoPanels();
            }
            // ("packaging", this.packdeprt)
        });
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        const temp = this.temp.filter((item: any) => {
            return (
                // Basic information
                (item.entryTypeName?.toLowerCase().includes(val)) ||
                (item.sDepartdate?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.sDepartdate, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                // Product-related
                (item.productName?.toLowerCase().includes(val)) ||
                // Quantity and Unit Information
                (item.qty?.toString().toLowerCase().includes(val)) ||
                (item.unitShortName?.toLowerCase().includes(val)) ||
                (item.destinationname?.toLowerCase().includes(val)) ||
                (item.approvalname?.toLowerCase().includes(val))
            );
        });
        this.packdeprt = temp;
        this.table.offset = 0;
    }
    getAllPackagingList() {
        this.socketService.emit('packaging-dpt:all', {});
    }
    // editData(Id: number) {
    //   this.router.navigate(['/pages/edit-packing-department/', Id]);
    // }
    getentry() {
        this.socketService.emit("ms-entry-type:all", {});
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Distributed Quantity', 'Rejected Quantity', 'Manager Approval'];
        csvData.push(headers.join(','));
        this.packdeprt.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                (row.EntryId === 2)
                    ? (row.dbtableName === 'Stock_Department'
                        ? 'Incoming Request'
                        : 'Outgoing Request')
                    : row.entryTypeName,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                row.productName,
                `${row.qty} ${row.unitShortName}`,
                `${row.distributed_quantity} ${row.unitShortName}`,
                `${row.rejected_quantity} ${row.unitShortName}`,
                row.approvalname,
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
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Distributed Quantity', 'Rejected Quantity', 'Manager Approval'];
        this.printService.print(headers, this.packdeprt, (row, index) => [
            (index + 1).toString(),
            (row.EntryId === 2)
                ? (row.dbtableName === 'Stock_Department'
                    ? 'Incoming Request'
                    : 'Outgoing Request')
                : row.entryTypeName,
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            row.productName,
            `${row.qty} ${row.unitShortName}`,
            `${row.distributed_quantity} ${row.unitShortName}`,
            `${row.rejected_quantity} ${row.unitShortName}`,
            row.approvalname,
        ]);
    }
    // finishedpage() {
    //     this.router.navigate(['/pages/finished-department']);
    // }
    goTopacking() {
        this.router.navigate(['/pages/packing-process']);
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
    finishedpage() {
        this.router.navigate(['/pages/inventory/finished-packaging']);
    }
    Unfinishedpage() {
        this.router.navigate(['/pages/inventory/unfinished-packaging']);
    }
    openQuantityModal(row: any) {
        this.selectedRow = row;
        $('#quantityInfoModal').modal('show');
    }
    initiateSendStock(row: any, adminTableId: any) {
        // Check if it's an incoming request
        if (row.EntryId === 2 && row.dbtableName === 'Stock_Department') {
            this.selectedRowForSending = row;
            this.isSendStockMode = true;
            const sendQuantityControl = this.sendStockForm.get('quantity');
            if (sendQuantityControl) {
                // Reset and update form validators
                sendQuantityControl.setValidators([
                    Validators.required,
                    Validators.min(1),
                    Validators.max(row.qty),
                ]);
                sendQuantityControl.updateValueAndValidity();
            }
            this.requestId = adminTableId
        }
    }
    // Method to send stock
    sendStockListen() {
        this.socketService.listen("stock-info:stock-out").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    sendStock() {
        if (this.sendStockForm.valid) {
            const formData = this.sendStockForm.value;
            const data = formData.quantity;
            const requestId = this.requestId
            this.socketService.emit("stock-info:stock-out", { quantity: data, requestId: requestId });
            // Reset the form and mode
            // this.cancelSendStock();
        }
    }
    // Method to cancel send stock mode
    cancelSendStock() {
        this.isSendStockMode = false;
        this.selectedRowForSending = null;
        this.sendStockForm.reset();
    }
}

