import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { InfoPanelData, InfoPanelsComponent } from '../dashboard/info-panels/info-panels.component';
import { FileUploaderComponent } from '../form-elements/controls/file-uploader/file-uploader.component';
import { Router } from '@angular/router';
import { PrintService } from '@services/print.service';
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';
declare var $: any; // For jQuery modal
@Component({
    selector: 'pasteurization-department',
    standalone: true,
    imports: [
        InfoPanelsComponent,
        NgxDatatableModule,
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './pasteurization-department.component.html',
    styleUrl: './pasteurization-department.component.scss'
})
export class PasteurizationDepartmentComponent implements OnInit, OnDestroy {
    // Add a property to store department ID
    currentDepartmentId: number;
    infoPanels: InfoPanelData[] = [];
    @ViewChild(DatatableComponent) table!: DatatableComponent;
    selectedRow: any = null;
    pasteurizationForm: FormGroup;
    rows: any[] = [];
    selected = [];
    temp: any[] = [];
    loadingIndicator = true;
    reorderable = true;
    iddata: number
    previewImageUrl: string | undefined;
    namesList: any[] = [];
    unitList: any[] = [];
    departmentList: any[] = [];
    departmentheadList: any[] = [];
    showForm: boolean = false;
    entyTypeId: number = 0;
    stockOutData: any;
    returnData: any;
    private subscriptions: Subscription[] = [];
    isEditMode: boolean = false;
    constructor(private toaster: ToastrService, public util: UtilityService, private webSockets: SocketService, private fb: FormBuilder, private router: Router, private printService: PrintService, private datePipe: DatePipe) {
        this.pasteurizationForm = this.fb.group({
            entryType: ['2', Validators.required],
            productId: ['27', Validators.required],
            quantity: ['', [Validators.required, Validators.min(0)]],
            unitId: ['0', Validators.required],
            departmentId: ['0', Validators.required],
            departmentHead: ['0'],
            id: ['']
        });
    }
    @ViewChild("closeButton") closeButton: ElementRef | undefined;
    close() {
        this.closeButton?.nativeElement.click();
    }
    ngOnInit() {
        // this.initForm();
        this.loadData();
        this.getAllentryTypes();
        this.getEntryType();
        this.pasteurizationDataListen()
        this.pasteurizationData()
        this.departmentHeadListen()
        this.editEntryTypeListen()
        this.updatePasteurizationListen();
        this.deleteDataListen();
        this.acceptStockListner();
        this.listenAdmiReturn()
        const sub = this.webSockets.listen("error").subscribe((error: any) => {
            this.toaster.error(error.message);
        });
        const sub4 = this.webSockets.listen('ms-entry-type:by-id').subscribe((rowData: any) => {
            const { data } = rowData;
            // this.webSockets.emit("department:head", { department_id: Number(data.department_id), role_id: [11, 3] });
        });
        const sub5 = this.webSockets.listen('pasteurization-dpt:add').subscribe((response: any) => {
            if (response.success) {
                this.toaster.success(response.message);
                this.pasteurizationForm.reset({
                    entryType: 0,
                    productId: 0,
                    unitId: 0,
                    departmentId: 0,
                    departmentHead: 0,
                });
                this.isEditMode = false;
                this.pasteurizationData()
            } else {
                this.toaster.error(response.message);
            }
        });
        this.subscriptions.push(sub5);
        this.webSockets.listen("quality:update").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success("update quality", res.message);
                this.closeForm();
                this.pasteurizationData()
                return;
            }
            this.toaster.error(res.message);
        })
    }
    pasteurizationDataListen() {
        this.webSockets.listen('pasteurization-dpt:all').subscribe((res: any) => {
            if (res.success) {
                this.rows = res.data;
                // // console.log("rows", this.rows);
                this.temp = [...this.rows];
                this.updateInfoPanels();
            } else {
                this.toaster.error(res.message)
            }
        })
        // to listen broadcast 
        this.webSockets.listen('Pasteurization_Department').subscribe((res: any) => {
            if (res.success) {
                this.rows = res.data;
                this.updateInfoPanels();
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    pasteurizationData() {
        this.webSockets.emit("pasteurization-dpt:all", {});
    }
    entryType: any[] = [];
    getAllentryTypes() {
        this.webSockets.listen('ms-entry-type:all').subscribe((res: any) => {
            if (res?.success) {
                this.entryType = res.data;
            }
        })
    }
    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    loadData() {
        this.loadingIndicator = true;
        this.subscribeToWebSocketError();
        this.loadProducts();
        this.loadUnits();
        this.loadDepartments();
    }
    private subscribeToWebSocketError() {
        this.subscriptions.push(
            this.webSockets.listen("error").subscribe((error) => {
                // Implement user-facing error handling here
            })
        );
    }
    loadProducts() {
        this.webSockets.emit("products:all", {});
        this.subscriptions.push(
            this.webSockets.listen("products:all").subscribe((product: any) => {
                this.namesList = product.data;
                // ('Received product data:', product);
                this.loadingIndicator = false;
            })
        );
    }
    loadUnits() {
        this.webSockets.emit("ms-unit:all", {});
        this.subscriptions.push(
            this.webSockets.listen("ms-unit:all").subscribe((unit: any) => {
                this.unitList = unit.data;
                this.updateInfoPanels();
            })
        );
    }
    acceptStockListner() {
        this.subscriptions.push(
            this.webSockets.listen("stock-info:accept-stock").subscribe((res: any) => {
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
        this.webSockets.emit("stock-info:accept-stock", { id: entryId });
    }
    loadDepartments() {
        this.webSockets.emit("department:all", {});
        this.subscriptions.push(
            this.webSockets.listen("department:all").subscribe((department: any) => {
                this.departmentList = department.data;
                // Find pasteurization department ID
                const pasteurizationDept = this.departmentList.find(
                    dept => dept.name.toLowerCase().includes('pasteurization')
                );
                if (pasteurizationDept) {
                    this.currentDepartmentId = pasteurizationDept.id;
                }
                // ('Received department data:', department);
            })
        );
    }
    departmentHeadListen() {
        this.webSockets.listen("department:head").subscribe((response: any) => {
            if (response.success) {
                this.departmentheadList = response.data;
            } else {
                this.toaster.error(response.message)
            }
            // ('Received department head data:', response);
        })
    }
    departmentHead(departmentInput: Event | number) {
        let departmentId: number
        if (typeof departmentInput === 'number') {
            departmentId = departmentInput
        } else {
            const target = departmentInput.target as HTMLSelectElement;
            departmentId = Number(target.value);
        }
        if (!isNaN(departmentId) && departmentId != 0) {
            this.webSockets.emit("department:head", { department_id: departmentId, role_id: [11, 3] });
        } else {
            this.departmentheadList = [];
        }
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // Filter the data based on the search input
        const filteredData = this.temp.filter((item: any) => {
            // Convert numeric status to string (Active/Deactive) for filtering
            const statusText = item.pidStatus === 1 ? 'active' : 'deactive';
            return (
                // Basic information
                (item.entryTypeName?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                // Product-related
                (item.productName?.toLowerCase().includes(val)) ||
                // Quantity and Unit Information
                (item.qty?.toString().toLowerCase().includes(val)) ||
                (item.unitShortName?.toLowerCase().includes(val)) ||
                (item.QtysiloBox?.toString().toLowerCase().includes(val)) ||
                // Manager and Approval Information
                (item.Name?.toLowerCase().includes(val)) ||
                (item.DepartmenheadName?.toLowerCase().includes(val)) ||
                (item.manager_approval?.toLowerCase().includes(val)) ||
                statusText.includes(val) || // Check against "active" or "deactive"
                !val
            );
        });
        // Update the displayed rows
        this.rows = filteredData;
        // Reset to the first page when the filter changes
        this.table.offset = 0;
    }
    onSubmit() {
        if (this.pasteurizationForm.valid) {
            const formData = { ...this.pasteurizationForm.value }
            this.webSockets.emit('pasteurization-dpt:add', { ...formData });
        } else {
            this.toaster.error("Please Fill All Fields!!")
        }
    }
    editData(pid: any, entryTypeId: any) {
        this.router.navigate([`/pages/pasteurization-silo/` + pid], { queryParams: { entryTypeId } });
    }
    goToInfo() {
        this.router.navigate(['/pages/pasteurization-silo-info']);
    }
    getEntryType() {
        this.webSockets.emit('ms-entry-type:all', {})
    }
    private countQuantity(): number {
        return this.rows.filter(item => item.qty).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    }
    // private countMilkItem(): number {
    //     return this.rows.filter(item => item.productName === "Milk").reduce((sum, item) => sum + (Number(item.quant) || 0), 0);
    // }
    // private countDistributedQuantity(): number {
    //     return this.rows.filter(item => item.productName === "Milk").reduce((sum, item) => sum + (Number(item.distributedQtyInSiloBox) || 0), 0);
    // }
    private countRequest(): number {
        return this.rows.filter(item => item.entryTypeName === "Request").length;
    }
    private counttotalStockout(): number {
        return this.rows.filter(item => item.entryTypeName === "Stock Out").length;
    }
    private countApprovalStatus(): number {
        return this.rows.filter(item => item.manager_approval === "Pending").length;
    }
    private countManagerApproved(): number {
        return this.rows.filter(item => item.manager_approval === "Approved").length;
    }
    private updateInfoPanels(): void {
        const totalEntries = this.rows.length;
        const totalquantity = this.countQuantity();
        // const totaldistributedQuantity = this.countDistributedQuantity();
        const totalApproved = this.countManagerApproved();
        const totalStockout = this.counttotalStockout();
        const totalPending = this.countApprovalStatus();
        const totalStock = this.countRequest();
        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Quantity Available(Ltr) ', value: totalquantity, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Entries of Stock Out', value: totalStockout, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
            { name: 'Entries of Request', value: totalStock, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
            //  { name: 'Total  Distributed Quantity', value: totaldistributedQuantity, icon: 'fa fa-cubes', color: '#F47B00', format: 'number' },
            { name: 'Total Pending', value: totalPending, icon: 'fa fa-circle-o-notch', color: '#378D3B', format: 'number' },
            { name: 'Total Approved', value: totalApproved, icon: 'fa fa-cube', color: '#F47B00', format: 'number' },
        ];
    }
    closeForm() {
        this.pasteurizationForm.reset({
            entryType: 0,
            productId: 0,
            unitId: 0,
            departmentId: 0,
            departmentHead: 0,
        });
        this.isEditMode = false;
        this.entyTypeId = 0;
        this.closeButton?.nativeElement?.click();
    }
    editEntryTypeListen() {
        this.webSockets.listen('pasteurization-dpt:get-data-by-id').subscribe((res: any) => {
            if (res.success) {
                const { data } = res;
                const departId = parseInt(data.DepartId); // Changed from departmentId to DepartId to match response
                // First fetch department heads
                this.webSockets.emit("department:head", {
                    department_id: departId,
                    role_id: [11, 3]
                });
                // Subscribe to department heads response
                const departmentHeadSub = this.webSockets.listen("department:head").subscribe((headRes: any) => {
                    if (headRes.success) {
                        this.departmentheadList = headRes.data;
                        // Now set form values after department heads are loaded
                        this.pasteurizationForm.patchValue({
                            id: Number(data.pid),
                            entryType: Number(data.EntryId),
                            productId: Number(data.prodId),
                            quantity: Number(data.qty),
                            unitId: Number(data.unitId),
                            departmentId: departId,
                            departmentHead: Number(data.DepartHId)
                        });// to the top
                        window.scrollTo({ top: 0, behavior: 'smooth' });// to the top
                        // Unsubscribe from this temporary subscription
                        departmentHeadSub.unsubscribe();
                    } else {
                        this.toaster.error('Failed to load department heads');
                    }
                });
                // Add the temporary subscription to our subscriptions array
                this.subscriptions.push(departmentHeadSub);
            } else {
                this.toaster.error(res.message);
            }
        });
    }
    // Modified edit method
    editEntryType(pid: number) {
        if (pid) {
            this.iddata = pid;
            this.webSockets.emit('pasteurization-dpt:get-data-by-id', { pid });
        } else {
            this.toaster.error('Invalid entry ID');
        }
    }
    updatePasteurizationListen() {
        this.webSockets.listen('pasteurization-dpt:update').subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
                this.pasteurizationForm.reset({
                    entryType: 0,
                    productId: 0,
                    unitId: 0,
                    departmentId: 0,
                    departmentHead: 0,
                });  // Reset the form
                this.closeForm();  // Close the modal
                this.pasteurizationData();  // Refresh the data
                this.isEditMode = false;  // Reset edit mode
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    // Modified update method
    updatePasteurization() {
        if (this.pasteurizationForm.valid) {
            const formData = {
                ...this.pasteurizationForm.value,
                id: this.iddata  // Ensure ID is included
            };
            this.webSockets.emit('pasteurization-dpt:update', formData);
        } else {
            this.toaster.error('Please fill all required fields');
        }
    }
    deleteDataListen() {
        this.webSockets.listen('pasteurization-dpt:delete').subscribe((res: any) => {
            // ("data", response)
            if (res.success) {
                // // console.log(response)
                Swal.fire(
                    'Deleted!',
                    'Your product has been deleted.',
                    'success'
                );
                return;
            }
            Swal.fire(
                'Error!',
                'There was an issue deleting the product.',
                'error'
            );
        })
    }
    // deleteData(id: number) {
    //     this.webSockets.emit('pasteurization-dpt:delete', { id })
    // }
    deleteData(id: number) {
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
                this.webSockets.emit('pasteurization-dpt:delete', { id })
            }
        });
    }
    // listen admin return details
    listenAdmiReturn() {
        const ars = this.webSockets.listen("common:admin-return-details").subscribe((res: any) => {
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
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Rejected Quantity', 'Distributed Quantity', 'Department', 'Department Head', 'Manager Approval', 'Status'];
        csvData.push(headers.join(','));
        this.rows.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                row.entryTypeName,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                row.productName,
                `${row.qty} ${row.unitShortName}`,
                `${row.rejected_quantity} ${row.unitShortName}`,
                `${row.QtysiloBox} ${row.unitShortName}`,
                row.Department_Name,
                row.DepartmenheadName,
                row.manager_approval,
                row.status == "0" ? "Deactive" : "Active", // Dynamically show status,
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
        const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Rejected Quantity', 'Distributed Quantity', 'Department', 'Department Head', 'Manager Approval', 'Status'];
        this.printService.print(headers, this.rows, (row, index) => [
            (index + 1).toString(),
            row.entryTypeName,
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            row.productName,
            `${row.qty} ${row.unitShortName}`,
            `${row.rejected_quantity} ${row.unitShortName}`,
            `${row.QtysiloBox} ${row.unitShortName}`,
            row.Department_Name,
            row.DepartmenheadName,
            row.manager_approval,
            row.status == "0" ? "Deactive" : "Active", // Dynamically show status,
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
    openQuantityModal(row: any) {
        // debugger
        if (row.admin_table_id) {
            this.webSockets.emit("common:admin-return-details", { id: row.admin_table_id })
        }
        this.selectedRow = row;
    }
}

