import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

interface PackingData {
    id?: number;
    product_id: number;
    ms_product_type_id: number;
    unit_id: number;
    weight: number;
    mrp: number;
    product_name?: string;
    product_type?: string;
    name?: string;
    created_on?: Date;
}

@Component({
    selector: 'app-master-packaging-size',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './master-packaging-size.component.html',
    styleUrl: './master-packaging-size.component.scss'
})
export class MasterPackagingUnitComponent implements OnInit, OnDestroy {
    @ViewChild(DatatableComponent) table: DatatableComponent;
    @ViewChild("closeButton") closeButton: ElementRef;

    private subscriptions: Subscription[] = [];

    packData: PackingData[] = [];
    temp: PackingData[] = [];
    productList: any[] = [];
    unitList: any[] = [];
    proTypeList: any[] = [];

    editForm: FormGroup;
    isEditMode = false;
    currentId = 0;
    loadingIndicator = true;

    constructor(
        private socketService: SocketService,
        private toastr: ToastrService,
        private fb: FormBuilder,
        private datePipe: DatePipe
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.initializeDataListeners();
        this.loadInitialData();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private initForm(): void {
        this.editForm = this.fb.group({
            productId: [0, Validators.required],
            productType: [0, Validators.required],
            unitId: [0, Validators.required],
            weight: ['', Validators.required],
            mrp: ['', Validators.required],
        });
    }

    private loadInitialData(): void {
        this.socketService.emit("ms-product-type:all", {});
        this.socketService.emit("ms-packing-size:all", {});
    }

    private initializeDataListeners(): void {
        // Packaging Size Data Listener
        this.addSubscription(
            this.socketService.listen("ms-packing-size:all").subscribe((response: any) => {
                if (response.success) {
                    this.packData = response.data;
                    this.temp = [...this.packData];
                } else {
                    this.handleError(response);
                }
            })
        );

        // Product Type Listener
        this.addSubscription(
            this.socketService.listen("ms-product-type:all").subscribe((proType: any) => {
                if (proType.success) {
                    this.proTypeList = proType.data;
                } else {
                    this.handleError(proType);
                }
            })
        );

        // Unit List Listener
        this.addSubscription(
            this.socketService.listen("ms-unit:supported-units").subscribe((unit: any) => {
                if (unit.success) {
                    this.unitList = unit.data;
                } else {
                    this.handleError(unit);
                }
            })
        );

        // Product List Listener
        this.addSubscription(
            this.socketService.listen("productsbyTypeId:all").subscribe((product: any) => {
                if (product.success) {
                    this.productList = product.data;
                } else {
                    this.toastr.error(product.message);
                    this.loadingIndicator = false;
                }
            })
        );

        // Edit Mode Listeners
        this.setupEditModeListeners();

        // Create and Update Listeners
        this.setupCreateUpdateListeners();
    }

    private setupEditModeListeners(): void {
        this.addSubscription(
            this.socketService.listen("ms-packing-size:by-id").subscribe((res: any) => {
                if (res.success) {
                    const data = res.data;
                    this.currentId = data.id;
                    this.clearDependentLists();
                    this.loadDependentData(data);
                    this.populateEditForm(data);
                } else {
                    this.toastr.error(res.message || 'Failed to load packaging unit details');
                }
            })
        );
    }

    private setupCreateUpdateListeners(): void {
        // Packing Size Update Listener
        this.addSubscription(
            this.socketService.listen("ms-packing-size:update").subscribe((res: any) => {
                if (res.success) {
                    this.toastr.success("Update packing size", res.message);
                    this.closeForm();
                } else {
                    this.toastr.error(res.message);
                }
            })
        );

        // Packing Size Create Listener
        this.addSubscription(
            this.socketService.listen('ms-packing-size:create').subscribe((response: any) => {
                if (response.success) {
                    this.toastr.success(response.message);
                    this.resetForm();
                } else {
                    this.toastr.error(response.message);
                }
            })
        );
    }

    private addSubscription(subscription: Subscription): void {
        this.subscriptions.push(subscription);
    }

    private handleError(response: any): void {
        this.toastr.error(response.message);
        if (response.error === 402) {
            this.socketService.Logout();
        }
    }

    private clearDependentLists(): void {
        this.productList = [];
        this.unitList = [];
    }

    private loadDependentData(data: PackingData): void {
        this.socketService.emit("productsbyTypeId:all", { ProductTypeId: data.ms_product_type_id });
        this.socketService.emit("ms-unit:supported-units", { id: data.product_id });
    }

    private populateEditForm(data: PackingData): void {
        this.editForm.patchValue({
            productId: Number(data.product_id),
            productType: Number(data.ms_product_type_id),
            unitId: Number(data.unit_id),
            weight: Number(data.weight),
            mrp: Number(data.mrp),
        });
        // to the top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private resetForm(): void {
        this.editForm.reset({
            productId: 0,
            productType: 0,
            unitId: 0,
            weight: '',
            mrp: '',
        });
    }

    // Public methods
    onSubmit(): void {
        if (this.editForm.valid) {
            const formData = { ...this.editForm.value };
            this.socketService.emit('ms-packing-size:create', formData);
        } else {
            this.toastr.warning('Please fill all required fields.');
        }
    }

    updatePacking(): void {
        if (this.editForm.valid) {
            const data = { ...this.editForm.value, id: this.currentId };
            this.socketService.emit("ms-packing-size:update", { ...data, id: data.id });
        }
    }

    editPackData(packId: number): void {
        this.isEditMode = true;
        this.currentId = packId;
        this.clearDependentLists();
        this.socketService.emit('ms-packing-size:by-id', { id: packId });
    }

    updateFilter(event: Event): void {
        const val = (event.target as HTMLInputElement).value.toLowerCase();
        const filteredData = this.temp.filter((item: PackingData) =>
            !val || [
                item.product_name?.toLowerCase(),
                item.product_type?.toLowerCase(),
                item.name?.toLowerCase(),
                item.mrp?.toString().toLowerCase(),
                item.weight?.toString().toLowerCase(),
                this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase()
            ].some(field => field?.includes(val))
        );

        this.packData = filteredData;
        this.table.offset = 0;
    }

    closeForm(): void {
        this.editForm.reset();
        this.isEditMode = false;
        this.closeButton?.nativeElement?.click();
    }

    loadProductsByProductType(event: Event): void {
        const id = (event.target as HTMLInputElement).value;
        this.socketService.emit("productsbyTypeId:all", { ProductTypeId: id });
    }

    loadProductUnits(event: Event): void {
        const id = (event.target as HTMLInputElement).value;
        this.socketService.emit("ms-unit:supported-units", { id });
    }
}