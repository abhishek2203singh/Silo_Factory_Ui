import { Component, OnInit, ViewChild } from '@angular/core';
import { InfoPanelsComponent, InfoPanelData } from '../../dashboard/info-panels/info-panels.component';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-product-department',
    standalone: true,
    imports: [InfoPanelsComponent, NgxDatatableModule, ReactiveFormsModule, CommonModule],
    templateUrl: './product-department.component.html',
    styleUrl: './product-department.component.scss'
})
export class ProductDepartmentComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    infoPanels: InfoPanelData[] = [];
    departments: any[];
    entryTypes: any[];
    products: any[];
    departmentHeads: any[];
    units: any[];
    form: FormGroup;
    subscriptions: Subscription[] = [];

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;

    columns = [
        { prop: 'name' },
        { name: 'Gender' },
        { name: 'Company' }
    ];

    constructor(
        private socketService: SocketService,
        private toaster: ToastrService,
        private router: Router,
        protected fb: FormBuilder

    ) {

        this.form = fb.group({
            entryType: [0, Validators.required],
            productId: [0, Validators.required],
            unitId: [0, Validators.required],
            quantity: [0, Validators.required],
            departmentId: [0, Validators.required],
            departmentHead: [0, Validators.required]
        })
        this.fetch((data: any) => {
            this.temp = [...data];
            this.rows = data;
        });
    }

    ngOnInit(): void {
        // add listner for errors 
        this.socketService.listen("error").subscribe((error: any) => {
            this.toaster.error(error.message)
        })
        
        this.tableDataListen()
        this.allEtryTypeListner();
        this.allDepartmentsListen();
        this.allProductsListners();
        this.departmentHeadListner();
        this.getAllUnitListners();
        this.addEntryListen();
        //
        this.getAllEntryTypes();
        this.getAllDepartments();
        this.gerAllUnits();
        this.getAllProducts();
        this.getTableData();

    }

    getTableData() {
        this.socketService.emit("other-dpt:all", {});
    }

    tableDataListen() {
        this.subscriptions.push(
            this.socketService.listen('other-dpt:all').subscribe((res: any) => {
                if (res?.success) {
                    this.rows = res.data
                    // // console.log("table data :", res.data)
                    return
                }
                this.toaster.error(res.message)
                if (res.error == 402) {
                    this.router.navigate(['/login']);
                    return
                }
            })
        )
    }

    addEntryListen() {
        this.subscriptions.push(
            this.socketService.listen('other-dpt:add').subscribe((res: any) => {
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
        )
    }

    allEtryTypeListner() {
        this.subscriptions.push(
            this.socketService.listen('ms-entry-type:all').subscribe((res: any) => {
                if (res?.success) {
                    this.entryTypes = res.data
                    // // console.log("entry type data :", res.data)
                    return
                }
                this.toaster.error(res.message)
                if (res.error == 402) {
                    this.router.navigate(['/login']);
                    return
                }
            })
        )
    }

    getAllUnitListners() {
        this.subscriptions.push(
            this.socketService.listen('ms-unit:all').subscribe((res: any) => {
                if (res?.success) {
                    this.units = res.data
                    return
                }
                this.toaster.error(res.message)
                if (res.error == 402) {
                    this.router.navigate(['/login']);
                    return
                }
            })
        )
    }

    getAllProducts() {
        this.socketService.emit("products:all", {})
    }

    getAllEntryTypes() {
        this.socketService.emit("ms-entry-type:all", {})
    }

    submitForm() {
        if (this.form.valid) {
            this.socketService.emit("other-dpt:add", this.form.value)
        }
    }

    gerAllUnits() {
        this.socketService.emit("ms-unit:all", {})
    }

    allDepartmentsListen() {
        this.socketService.listen('department:all').subscribe((res: any) => {
            if (res?.success) {
                this.departments = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })
    }
    getAllDepartments() {
        this.socketService.emit("department:all", {})
    }

    allProductsListners() {
        this.subscriptions.push(this.socketService.listen('products:all').subscribe((res: any) => {
            if (res?.success) {
                this.products = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        }))
    }

    private countMilkItem(): number {
        return this.rows.filter(item => item.productName === "Milk").reduce((sum, item) => sum + (Number(item.quant) || 0), 0);
    }

    departmentHeadListner() {
        this.subscriptions.push(
            this.socketService.listen(`department:head`).subscribe((res: any) => {
                // // console.log("dept heads => ", res)
                if (res?.success) {
                    this.departmentHeads = res.data
                    // console.log("departmentHeads: " + this.departmentHeads)
                    return
                }
                this.toaster.error(res.message)
                if (res.error == 402) {
                    this.router.navigate(['/login']);
                    return
                }
            })
        )
    }

    private countDistributedQuantity(): number {
        return this.rows.filter(item => item.productName === "Milk").reduce((sum, item) => sum + (Number(item.distributedQtyInSiloBox) || 0), 0);
    }

    getDepartmentHeads(event: Event) {
        const departmetnId = (event.target as HTMLSelectElement).value;
        // console.log("dpt id =>", departmetnId)
        this.socketService.emit("department:head", { department_id: departmetnId, role_id: 3 })
    }

    private updateInfoPanels(): void {
        const totalEntries = this.rows.length;
        const totalquantity = this.countMilkItem();
        const totaldistributedQuantity = this.countDistributedQuantity();
        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Quantity Available(Ltr) ', value: totalquantity, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
            { name: 'Total  Distributed Quantity', value: totaldistributedQuantity, icon: 'fa fa-cubes', color: '#F47B00', format: 'number' },
            // Add more panels as needed
        ];
    }

    fetch(data: any) {
        const req = new XMLHttpRequest();
        req.open('GET', 'data/company.json');
        req.onload = () => {
            data(JSON.parse(req.response));
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

    updateValue(event: any, cell: any, cellValue: any, row: any) {
        this.editing[row.$$index + '-' + cell] = false;
        this.rows[row.$$index][cell] = event.target.value;
    }
}
