import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import City from '../../../Models/city.model';
import State from '../../../Models/state.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { PrintService } from '@services/print.service';

@Component({
    selector: 'app-customer-details',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    baseImgUrl: string;
    currentPic: string = "1724994358500.png";
    cityList: City[];
    stateList: State[];
    orderData: any[] = [];
    orderForm: FormGroup;
    products: any[];
    subscriptions: Subscription[] = [];
    List: any[] = [];
    packingList: any[] = [];
    namesList: any[] = [];
    isEditMode: boolean = false;

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    constructor(private router: Router, protected baseService: BaseService, private socketService: SocketService, private printService: PrintService,
        private toaster: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
        this.orderForm = this.fb.group({
            productId: [0, [Validators.required, Validators.min(1)]],
            packingSize: [0, [Validators.required, Validators.min(1)]],
            quantity: ['', [Validators.required, Validators.min(1)]],
            deliveryDate: ['', [Validators.required]],
            price: [{ value: '', disabled: true }], // Disabled because it's auto-filled
            deliveryCharges: [{ value: '', disabled: true }], // Disabled because it's auto-filled
        });
        this.fetch((data: any) => {
            this.temp = [...data];
            this.rows = data;
        });
        this.baseImgUrl = this.baseService.imageurl;
    }
    ngOnInit(): void {
        this.getAllData();
        this.getAllDataListen();
        this.getAllProducts();
        this.allProductsListners();
        this.onSubmitListen();


        this.socketService.listen('customer-order:cancel').subscribe((response: any) => {
            // ("data", response)
            if (response.success) {
                Swal.fire(
                    'Cancelled!',
                    'Your product has been cancelled.',
                    'success'
                );
                return;
            }
            Swal.fire(
                'Error!',
                'There was an issue cancelling the product.',
                'error'
            );

        })
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
        // Filter the data based on the search input
        const filteredData = this.temp.filter((item: any) => {
            // Create separate status check
            const statusMatch = val === 'active' ? item.status === 1 :
                val === 'cancelled' || val === 'cancel' ? item.status === 0 :
                    false;
            return (
                (this.datePipe.transform(item.order_date, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.requested_delivery_date, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (item.product_name?.toString().toLowerCase().includes(val)) ||
                (item.quantity?.toLowerCase().includes(val)) ||
                (item.price?.toString().includes(val)) ||
                (item.total_price?.toString().includes(val)) ||
                (item.delivery_boy_name?.toString().toLowerCase().includes(val)) ||
                statusMatch || // Check against "active" or "cancelled"
                !val
            );
        });

        // Update the displayed rows
        this.orderData = filteredData;

        // Reset to the first page when the filter changes
        this.table.offset = 0;
    }

    updateValue(event: any, cell: any, cellValue: any, row: any) {
        this.editing[row.$$index + '-' + cell] = false;
        this.rows[row.$$index][cell] = event.target.value;
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
            // console.log("aaa", this.packingList);
        })
    }
    allProductsListners() {
        this.socketService.listen("productsbyTypeId:all").subscribe((response: any) => {
            if (response.success) {
                this.List = response.data.filter((item: any) => item.msProductType === 3);
            }
            else {
                this.toaster.error(response.message);
                this.loadingIndicator = false;
            }
        });
    }

    getAllProducts() {
        this.socketService.emit("productsbyTypeId:all", { ProductTypeId: 3 })
    }
    getAllDataListen() {
        this.socketService.listen("customer-order:all").subscribe((res: any) => {
            if (res.success) {
                this.orderData = res.data
                console.log("dfgdfg", this.orderData)
                this.temp = [...this.orderData]
            } else {
                this.toaster.error(res.message)
            }
        })
    }

    getAllData() {
        this.socketService.emit("customer-order:all", {})
    }
    onSubmitListen() {
        this.socketService.listen("customer-order:create").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message)
                this.orderForm.reset({
                    productId: '0',
                    packingSize: '0',
                    quantity: '',
                    deliveryDate: '',
                });
            } else {
                this.toaster.error(res.message)
            }
        })
    }

    onSubmit() {
        if (this.orderForm.valid) {
            const formData = { ...this.orderForm.value };
            const selectedPackingSize = this.packingList.find(packing => packing.id === +formData.packingSize);

            if (selectedPackingSize) {
                const price = selectedPackingSize.mrp;
                const deliveryCharges = selectedPackingSize.delivery_charge || 0;

                Swal.fire({
                    title: 'Are you sure you want to submit this order?',
                    text: `Price: ${price},\nDelivery Charges: ${deliveryCharges}`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, submit it!',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        formData.price = price;
                        formData.delivery_charges = deliveryCharges;


                        this.socketService.emit('customer-order:create', formData);
                    }
                });
            } else {
                this.toaster.error("Please select a valid packing size.");
            }
        } else {
            this.toaster.error("Please fill all required fields.");
        }
    }


    Cancelorder(id: number) {
        Swal.fire({
            title: 'Are you sure to cancel the Order?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes,I want to cancel the Order!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Emit WebSocket event to delete product by ID
                this.socketService.emit('customer-order:cancel', { id });

            }
        }
        )
    }

    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Date', 'Requested Date', 'Product', 'Quantity', 'Price', 'Total', 'Delivery Boy', 'Delivery Status'];
        csvData.push(headers.join(','));

        this.orderData.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                this.datePipe.transform(row.order_date, 'MMM d, y') || 'N/A',
                this.datePipe.transform(row.requested_delivery_date, 'MMM d, y') || 'N/A',
                row.product_name || '',
                row.quantity || '',
                `₹${row.price || 0}`,
                `₹${row.total_price || 0}`,
                row.delivery_boy_name,
                row.status === 0
                    ? 'Cancelled'
                    : row.delivery_status_name || 'N/A'
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
        const headers = ['Sr. No', 'Date', 'Requested Date', 'Product', 'Quantity', 'Price', 'Total', 'Delivery Boy', 'Delivery Status'];

        this.printService.print(headers, this.orderData, (row, index) => [
            (index + 1).toString(),
            this.datePipe.transform(row.order_date, 'MMM d, y') || 'N/A',
            this.datePipe.transform(row.requested_delivery_date, 'MMM d, y') || 'N/A',
            row.product_name || '',
            row.quantity || '',
            `₹${row.price || 0}`,
            `₹${row.total_price || 0}`,
            row.delivery_boy_name,
            row.status === 0
                ? 'Cancelled'
                : row.delivery_status_name || 'N/A'
        ]);
    }
}

