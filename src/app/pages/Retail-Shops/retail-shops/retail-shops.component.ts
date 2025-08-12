import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { InfoPanelsComponent, InfoPanelData } from '../../dashboard/info-panels/info-panels.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { InfoCardsComponent } from '../../dashboard/info-cards/info-cards.component';
import Swal from 'sweetalert2';
import { PrintService } from '@services/print.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgToggleModule } from 'ng-toggle-button';
@Component({
    selector: 'app-retail-shops',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NgxDatatableModule, NgToggleModule],
    templateUrl: './retail-shops.component.html',
    styleUrl: './retail-shops.component.scss'
})
export class RetailShopsComponent implements OnInit {
    editing: any = {};
    isReturn: boolean = false;
    rows: any[] = [];
    temp: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    infoPanels: InfoPanelData[] = [];
    editId: any;
    retailForm: FormGroup;
    retailData: any[] = [];
    entryTypeData: any[] = [];
    productData: any[] = [];
    packingList: any[] = [];

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    fb = inject(FormBuilder);
    router = inject(Router)
    constructor(private socketService: SocketService, public toaster: ToastrService, private printService: PrintService, private datePipe: DatePipe) {
        this.retailForm = this.fb.group({
            entryType: [2, [Validators.required, Validators.min(1)]],
            productId: [0, [Validators.required, Validators.min(1)]],
            quantity: ['', [Validators.required, Validators.min(1)]],
            packingSizeId: [0, [Validators.required, Validators.min(1)]],
            message: ['',],
            id: ['']
        })
    }
    ngOnInit(): void {
        const sub = this.socketService.listen("error").subscribe((retail: any) => {
            this.toaster.error(retail.message);
        });
        this.getAllRetaildataListen();
        this.getAllRetaildata();
        this.getAllEntryTypeListen();
        this.getAllEntryType();
        this.loadProductsListen();
        this.loadProducts();
        this.addRetailShopListen();
        this.desabledEntrylisten();
        this.addRetailShopListen();
        this.returnStockItemListen();
        this.acceptEntryListen();
    }
    getAllRetaildataListen() {
        this.socketService.listen("retail-dpt:all").subscribe((res: any) => {
            if (res.success) {
                this.retailData = res.data;
                // console.log("retailData", this.retailData);
                this.temp = [...this.retailData];
            } else {
                this.toaster.error(res.message);
            }
        })
    }
    getAllRetaildata() {
        this.socketService.emit("retail-dpt:all", {});
    }
    getAllEntryTypeListen() {
        this.socketService.listen('ms-entry-type:all').subscribe((res: any) => {
            if (res.success) {
                this.entryTypeData = res.data;
            } else {
                this.toaster.error(res.message);
            }
        });
    }

    getAllEntryType() {
        this.socketService.emit("ms-entry-type:all", {});
    }

    loadProductsListen() {
        this.socketService.listen("products:by-product-type").subscribe((product: any) => {
            this.productData = product.data;
        })
    }
    loadProducts() {
        this.socketService.emit("products:by-product-type", { id: 3 });
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
            this.packingList = [];
        }

        this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
            this.packingList = unit.data;
        })
    }
    desabledEntrylisten() {
        this.socketService.listen("retail-dpt:update-status").subscribe((res: any) => {
            if (res.success) {
                Swal.fire("Delete user", res.message, "success");
                return;
            }

            Swal.fire("Delete user", res.message, "error");
        })
    }
    disabledEntry(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: ` To delete Data , You won't be able to revert this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Listen for the response from the server
                this.socketService.emit("retail-dpt:update-status", { id: id })
            }
        });

    }
    AddStock() {
        this.isReturn = false;
    }
    Return() {
        this.isReturn = true;
    }




    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        const filteredData = this.temp.filter((item: any) => {
            // Create separate status check
            const statusMatch = val === 'active' ? item.status === 1 :
                val === 'deactive' || val === 'deact' ? item.status === 0 :
                    false;

            return (
                // Search in all relevant fields
                (item.entryTypeName?.toLowerCase().includes(val)) ||
                (item.productName?.toLowerCase().includes(val)) ||
                (item.quantity?.toString().includes(val)) ||
                (item.weight_per_unit?.toString().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                statusMatch ||
                !val
            );
        });

        // update the rows
        this.retailData = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
    addRetailShopListen() {
        this.socketService.listen("retail-dpt:add-entry").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
                this.retailForm.reset({});
                return;
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    addRetailShop() {
        if (this.retailForm.valid) {
            const formData = this.retailForm.value
            this.socketService.emit("retail-dpt:add-entry", formData)
        }
    }
    // For return stock emit and listen ----

    returnStockItemListen() {
        this.socketService.listen("retail-dpt:return-stock").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
                this.retailForm.reset({
                    entryType: 2,
                    productId: 0,
                    masterPckSizeUnit: 0
                });
                this.isReturn = false;
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    returnStockItem() {
        const formData = this.retailForm.value;
        this.socketService.emit("retail-dpt:return-stock", formData);
    }
    // Accept stock from distribution center==================
    acceptEntryListen() {
        this.socketService.listen("retail-dpt:accept-stock").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    acceptEntry(id: number) {

        this.socketService.emit("retail-dpt:accept-stock", { id })
    }
    // Print and CSV function---------------------

    printFile() {
        const headers = ['Sr. No', 'Entry Date', 'Entry Type', 'Product', 'Quantity', 'Distributed Quantity', 'Packaging Size', 'Status'];
        this.printService.print(headers, this.retailData, (row, index) => [
            (index + 1).toString(),
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            row.entryTypeName,
            row.productName,
            `${row.quantity} ${row.unitShortName}`,
            `${row.distributed_quantity} ${row.unitShortName}`,
            `${row.weight_per_unit} ${row.unitShortName}`,
            row.status == "0" ? "Deactive" : "Active",
        ]);
    }


    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Entry Date', 'Entry Type', 'Product', 'Quantity', 'Distributed Quantity', 'Packaging Size', 'Status'];
        csvData.push(headers.join(','));
        this.retailData.forEach((row, index) => {
            const rowData = [
                index + 1,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                row.entryTypeName,
                row.productName,
                `${row.quantity} ${row.unitShortName}`,
                `${row.distributed_quantity} ${row.unitShortName}`,
                `${row.weight_per_unit} ${row.unitShortName}`,
                row.status == "0" ? "Deactive" : "Active",
            ];
            csvData.push(rowData.map(item => `"${item}"`).join(','));
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



}
