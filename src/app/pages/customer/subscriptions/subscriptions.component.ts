import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { FormGroup, FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Subscriptions } from '../../../Models/subscriptions';
import { UtilityService } from '@services/utility.service';
import Response from '../../../Models/apiRespose.model';
import { PrintService } from '@services/print.service';
interface Customer {
    id: number;
    full_name: string;
    mobile: string;
    address: string;
    email: string;
    available_balance: number;
    joining_date: Date;
    user?: any;
    invoicedata?: any[];
    dairydata?: {
        name: string;
        address1: string;
        address2: string;
        phone: string;
        dairy_mail: string;
        pincode: string;
    };
}
@Component({
    selector: 'app-customer-details',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, NgxPaginationModule, FormsModule, ReactiveFormsModule],
    templateUrl: './subscriptions.component.html',
    styleUrl: './subscriptions.component.scss'
})
export class SubscriptionsComponent implements OnInit {
    showScheduleForm: boolean[] = []; // Array to track form visibility for each row
    checked: boolean = false;
    scheduleDates: string[] = []; // Array to store schedule dates for each row
    customerId: string; // Add this property to store customer ID
    rows: any[] = [];
    customerList: any[] = []
    deliveryBoysData: any[] = [];
    editing: any = {};
    subcription: Subscriptions;
    newSubscriptions: NewSubscriptions[] = [];
    producListByType: Product[] = [];
    p = 1;
    employeinsert: FormGroup;
    changeDelivery: FormGroup;
    selectedCustomerId: number = 0;
    customerData: any[] = [];
    deactivatedCustomerData: any[] = [];
    deliveryboy: any[] = [];
    showSubInfo1: boolean = false;  // Controls visibility of first table
    showSubInfo: boolean = false;   // Controls visibility of new table
    temp: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    selected: any[] = [];
    socketService = inject(SocketService);
    toaster = inject(ToastrService);
    selectedCustomerIds: number[] = [];
    allSelected: boolean = false;
    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    showTable: boolean = false;
    isNewSubscription: boolean = false;
    subList1: any[] = [];
    subscriptions: Subscription[] = [];
    // New properties for invoice
    selectedCustomers: Customer[] = [];
    showInvoice: boolean = false;
    today: Date = new Date();
    dueDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
    columns = [
        { name: 'S.No.' },
        { name: 'Create Scheduling' },
        { prop: 'name' },
        { name: 'Phone' },
        { name: 'Address' },
        { name: 'Amount' },
        { name: 'View' }
    ];
    constructor(private router: Router, protected fb: FormBuilder, protected util: UtilityService, private printService: PrintService, private datePipe: DatePipe) {
        this.selection = SelectionType.checkbox;
        // Initialize the form in constructor
        this.employeinsert = new FormGroup({
            entryType: new FormControl('0')
        });
        this.changeDelivery = this.fb.group({
            currentBoy: [0, Validators.required],
            newBoy: [0, Validators.required],
            selectAll: [],
        });
        // this.changeDelivery = new FormGroup({
        //     currentBoy: new FormControl(''),
        //     newBoy: new FormControl(''),
        //     selectAll: new FormControl(false),
        // });
    }
    ngOnInit(): void {
        this.getDeliveryBoyList();
        this.getDeliveryBoyListListen();
        this.addNewSubscriptionListen();
        this.getProductByProductTypeID();
        this.scheduleDates = new Array(this.customerData.length).fill('');
        this.showScheduleForm = new Array(this.customerData.length).fill(false);
        const subscriber = this.socketService.listen("subscription:by-customer").subscribe((res: any) => {
            // ("citites =>", res.data)
            if (res.success) {
                this.subscriptions = res.data
                // console.log("subscription data =>", this.subscriptions)
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.socketService.Logout()
            }
        });
        const sub9 = this.socketService.listen("productsbyTypeId:all").subscribe((response: any) => {
            if (response.success) {
                this.producListByType = response.data;
                // console.log("prodcut details =>", this.producListByType)
                this.newSubscriptions = this.producListByType.map((prouct) => {
                    return {
                        ... new NewSubscriptions(),
                        productId: prouct.id,
                        product_name: prouct.product_name,
                        price: prouct.mrp,
                        quantity: 1,
                        unit_name: prouct.st_name
                    }
                })
                // console.log("new subsction data =>", this.newSubscriptions);
                // console.log('producListByType:', this.producListByType);
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.socketService.emit("subscription:by-customer", {});
        // Move the subscription to ngOnInit
        this.employeinsert.get('entryType')?.valueChanges.subscribe(value => {
            this.showTable = value !== '0' && value !== null;
        });
        const sub6 = this.socketService.listen("subscription:by-customer").subscribe((response: any) => {
            if (response.success) {
                this.subList1 = response.data;
                // console.log('Data:', this.subList1);
                this.temp = [...this.subList1]
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub6);
        this.socketService.listen('subscription:create-success').subscribe((response: any) => {
            if (response.success) {
                this.toaster.success('Subscription added successfully');
                this.showSubInfo = false;
                this.showSubInfo1 = true;
                // Refresh the subscription list
                this.getCustomerSubscriptions(this.selectedCustomerId);
            } else {
                this.toaster.error(response.message);
            }
        });
        // Listen for subscription update response
        const updateSub = this.socketService.listen('subscription:update').subscribe(
            (response: any) => {
                if (response.success) {
                    this.toaster.success(response.message);
                    this.getCustomerSubscriptions(this.selectedCustomerId);
                } else {
                    this.toaster.error(response.message);
                }
            }
        );
        this.subscriptions.push(updateSub);
        const sub8 = this.socketService.listen("user:get-customer-by-delivery-boy").subscribe((response: any) => {
            if (response.success) {
                this.customerList = response.data;
                // console.log('Data of customer according to delivery boy:', this.customerList);
                this.temp = [...this.customerList]
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub8);
    }
    // to add new subscriptions
    addNewSubscription() {
        // console.log("addNewSubscription =>", this.newSubscriptions)
        // find out actual subscriptions which user want to subscribe
        const actualSubscriptions = this.newSubscriptions.map((sub: NewSubscriptions) => {
            if (sub.productId && sub.quantity > 0 && (sub.sunday || sub.monday || sub.tuesday || sub.wednesday || sub.thursday || sub.friday || sub.saturday)) {
                return sub
            }
            return null
        }).filter(sub => sub !== null);
        // console.log("actual =>", actualSubscriptions)
        if (actualSubscriptions.length === 0) {
            this.toaster.error("Please select at least one product to subscribe");
            return;
        }
        const data = {
            customerId: this.util.getCurrentUser().id,
            subscriptions: actualSubscriptions
        }
        this.socketService.emit("subscription:create", data)
        // console.log("created subscription", data);

    }
    addNewSubscriptionListen() {
        this.socketService.listen("subscription:create").subscribe((response: any) => {
            if (response.success) {
                this.toaster.success(response.message);
                this.getCustomerSubscriptions(this.selectedCustomerId);
                return;
            }
            this.toaster.error(response.message);
        });
    }
    //listen to add new subscriptions
    getDeliveryBoyList() {
        this.socketService.emit("user:get-delivery-boy", {});
    }
    getProductByProductTypeID() {
        this.socketService.emit("productsbyTypeId:all", { ProductTypeId: 3 });
    }
    showSubscriptionDialog() {
        this.isNewSubscription = true
    }
    getDeliveryBoyListListen() {
        this.socketService.listen("user:get-delivery-boy").subscribe((res: any) => {
            if (res.success) {
                this.deliveryBoysData = res.data;
                // console.log("dellivery boys =>", res.data)
                // console.log("deliveryBoysData", this.deliveryBoysData);
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    hideSubscriptionDialog() {
        this.isNewSubscription = false;
    }
    // newentry() {
    //   this.subTableVisible = false;
    //   this.newSubTableVisible = true;
    // }
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
    onSelect(row: any, event: any) {
        const isChecked = event.target.checked;
        if (isChecked) {
            this.selected.push(row);
        } else {
            const index = this.selected.findIndex(selectedRow => selectedRow.id === row.id);
            this.selected.splice(index, 1);
        }
    }
    onSelectAll(event: any) {
        const isChecked = event.target.checked;
        this.selectAll = isChecked;
        if (isChecked) {
            this.selected = [...this.rows];
        } else {
            this.selected = [];
        }
    }
    isSelected(row: any): boolean {
        return this.selected.findIndex(selectedRow => selectedRow.id === row.id) !== -1;
    }
    onCustomerSelect(event: any): void {
        const id = Number(event.target.value);
        this.selectedCustomerId = id;
        if (!isNaN(id) && id !== 0) {
            this.getCustomerSubscriptions(id);
            this.showSubInfo1 = true;
            this.showSubInfo = false;
        } else {
            this.showSubInfo1 = false;
            this.showSubInfo = false;
            this.subList1 = [];
        }
    }
    getCustomerSubscriptions(customerId: number) {
        this.socketService.emit('subscription:by-customer', {
            id: this.util.getCurrentUser().id
        });
    }
    showNewInfo(): void {
        this.showSubInfo1 = false;  // Hide first table
        this.showSubInfo = true;    // Show new table
    }
    updateSubscription(): void {
        // debugger
        const updatedSubscriptions: any[] = [];
        // Get all rows from the first table
        const rows = document.querySelectorAll('#subinfo1 tbody tr');
        // rows.forEach((row: any) => {
        //   const subscription = {
        //     id: row.querySelector('input[name="productid"]').value,
        //     product_id: row.querySelector('input[name="productid"]').value,
        //     shift: row.querySelector('select[name="shift[]"]').value,
        //     delivery_boy_id: row.querySelector('select[name="deliverboy[]"]').value,
        //     quantity: row.querySelector('input.form-control').value,
        //     monday: row.querySelector('input[id^="m"]').checked ? 1 : 0,
        //     tuesday: row.querySelector('input[id^="t"]').checked ? 1 : 0,
        //     wednesday: row.querySelector('input[id^="w"]').checked ? 1 : 0,
        //     thursday: row.querySelector('input[id^="th"]').checked ? 1 : 0,
        //     friday: row.querySelector('input[id^="f"]').checked ? 1 : 0,
        //     saturday: row.querySelector('input[id^="s"]').checked ? 1 : 0,
        //     sunday: row.querySelector('input[id^="su"]').checked ? 1 : 0
        //   };
        //   updatedSubscriptions.push(subscription);
        // });
        // Emit socket event for batch update
        // Emit socket event with customer ID
        this.socketService.emit('subscription:update', {
            userId: this.customerId, // Include customer ID
            subscriptions: updatedSubscriptions
        });
    }
    addSubscription(): void {
        const newSubscriptions: any[] = [];
        // Get all rows from the second table
        const rows = document.querySelectorAll('#subinfo tbody tr');
        rows.forEach((row: any) => {
            const subscription = {
                product_id: row.querySelector('input[name="productid"]').value,
                shift: row.querySelector('select[name="shift[]"]').value,
                delivery_boy_id: row.querySelector('select[name="deliverboy[]"]').value,
                quantity: row.querySelector('input[name="quantity[]"]').value,
                monday: row.querySelector('input[id^="m"]').checked ? 1 : 0,
                tuesday: row.querySelector('input[id^="t"]').checked ? 1 : 0,
                wednesday: row.querySelector('input[id^="w"]').checked ? 1 : 0,
                thursday: row.querySelector('input[id^="th"]').checked ? 1 : 0,
                friday: row.querySelector('input[id^="f"]').checked ? 1 : 0,
                saturday: row.querySelector('input[id^="s"]').checked ? 1 : 0,
                sunday: row.querySelector('input[id^="su"]').checked ? 1 : 0,
                customer_id: this.selectedCustomerId
            };
            // Validate required fields
            if (!subscription.product_id || !subscription.shift ||
                !subscription.delivery_boy_id || !subscription.quantity) {
                this.toaster.error('Please fill in all required fields');
                return;
            }
            // Validate at least one day is selected
            if (!(subscription.monday || subscription.tuesday || subscription.wednesday ||
                subscription.thursday || subscription.friday || subscription.saturday ||
                subscription.sunday)) {
                this.toaster.error('Please select at least one day');
                return;
            }
            newSubscriptions.push(subscription);
        });
        if (newSubscriptions.length > 0) {
            // Emit socket event for creating new subscriptions
            this.socketService.emit('subscription:create', {
                subscriptions: newSubscriptions
            });
        }
    }
    getDeliveryBoyData(): void {
        this.socketService.emit('user:get-delivery-boy', {});
    }
    // ngOnDestroy() {
    //     this.subscriptions.forEach(sub => sub.unsubscribe());
    // }
    VisitDetails(id: number) {
        this.router.navigate([`/pages/customer-details`, id]);
    }
    toggleScheduleForm(index: number) {
        this.showScheduleForm[index] = !this.showScheduleForm[index];
        if (!this.showScheduleForm[index]) {
            this.scheduleDates[index] = ''; // Clear the date when closing the form
        }
    }
    onSubmitSchedule(index: number) {
        if (this.scheduleDates[index]) {
            // console.log(`Scheduling for row ${index}: ${this.scheduleDates[index]}`);
            // Add your scheduling logic here
            // Reset and hide the form
            this.scheduleDates[index] = '';
            this.showScheduleForm[index] = false;
        }
    }
    handleCheckboxChange(customer: Customer, event: Event, index: number): void {
        const checkbox = event.target as HTMLInputElement;
        this.onSelectuser(customer, checkbox.checked, index);
    }
    onSelectuser(customer: Customer, checked: boolean, index: number) {
        if (checked) {
            if (!this.selectedCustomers.find(c => c.id === customer.id)) {
                this.selectedCustomers.push(customer);
            }
            const checkedAllElement = document.getElementById('checkedAll') as HTMLInputElement | null;
            const allCheckboxes = document.getElementsByClassName('checkSingle') as HTMLCollectionOf<HTMLInputElement>
                ;
            if (checkedAllElement) {
                const allChecked = Array.from(allCheckboxes).every(checkbox => checkbox.checked);
                checkedAllElement.checked = allChecked;
            }
        } else {
            const customerIndex = this.selectedCustomers.findIndex(c => c.id === customer.id);
            if (customerIndex > -1) {
                this.selectedCustomers.splice(customerIndex, 1);
            }
            const checkedAllElement = document.getElementById('checkedAll') as HTMLInputElement | null;
            if (checkedAllElement) {
                checkedAllElement.checked = false;
            }
        }
        this.showInvoice = this.selectedCustomers.length > 0;
    }
    onSelectAllemp() {
        const checkedAllElement = document.getElementById('checkedAll') as HTMLInputElement | null;
        if (!checkedAllElement) return;
        const isChecked = checkedAllElement.checked;
        const checkboxes = document.getElementsByClassName('checkSingle') as HTMLCollectionOf<HTMLInputElement>
            ;
        if (isChecked) {
            this.selectedCustomers = [...this.customerData];
            Array.from(checkboxes).forEach(checkbox => {
                checkbox.checked = true;
            });
        } else {
            this.selectedCustomers = [];
            Array.from(checkboxes).forEach(checkbox => {
                checkbox.checked = false;
            });
        }
        this.showInvoice = this.selectedCustomers.length > 0;
    }
    printInvoice() {
        if (this.selectedCustomers.length === 0) {
            this.toaster.warning('Please select at least one customer to generate invoice');
            return;
        }
        const invoicePrintElement = document.getElementById('invoiceprint');
        const printContents = invoicePrintElement?.innerHTML;
        if (printContents) {
            const originalContents = document.body.innerHTML;
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.open();
                printWindow.document.write(`
<html>
   <head>
      <title>Invoice</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
      <style>
         @media print {
         .no-print { display: none; }
         @page { margin: 1cm; }
         }
      </style>
   </head>
   <body>${printContents}</body>
</html>
`);
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            } else {
                this.toaster.error('Unable to open print window');
            }
        }
    }
    // Mock API call to update customers
    // Toggle individual selection
    toggleSelection(customerId: number, isSelected: boolean): void {
        if (isSelected) {
            this.selectedCustomerIds.push(customerId);
        } else {
            this.selectedCustomerIds = this.selectedCustomerIds.filter(id => id !== customerId);
        }
        this.allSelected = this.customerList.every(customer => customer.selected);
    }
    // Handle "Select All" functionality
    selectAll(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const isChecked = inputElement.checked;
        this.allSelected = isChecked;
        this.selectedCustomerIds = isChecked ? this.customerList.map(customer => customer.id) : [];
        this.customerList.forEach(customer => (customer.selected = isChecked));
    }
    // Update selected customers to the new delivery boy
    // Reset selections and table
    resetSelections(): void {
        this.selectedCustomerIds = [];
        this.allSelected = false;
        this.customerList.forEach(customer => (customer.selected = false));
        this.changeDelivery.get('selectAll')?.setValue(false, { emitEvent: false });
    }
    printFile() {
        const headers = ['Sr. No', 'Product', 'Shift', 'Delivery Agent', 'Quantity', 'Update Quantity', 'Day Selection', 'Actual Price'];

        this.printService.print(headers, this.subscriptions, (row, index) => [
            (index + 1).toString(),
            row.product_name || '',
            row.shift_name || '',
            row.delivery_boy_name || '',
            row.quantity || '',
            row.updateQuantity || '',
            [
                row.sunday && 'Sun',
                row.monday && 'Mon',
                row.tuesday && 'Tue',
                row.wednesday && 'Wed',
                row.thursday && 'Thu',
                row.friday && 'Fri',
                row.saturday && 'Sat',
            ]
                .filter(Boolean)
                .join(', ') + (row.alternate_day ? `Alternate Day(${this.datePipe.transform(row.alternate_day, 'MMM d, y') || ''})` : ''),
            `₹${row.userPrice || 0}`,
        ]);
    }
}
class NewSubscriptions {
    userId: number = 0;
    product_name: string;
    deliveryBoyId: number = 0;
    unit_name: string;
    productId: number = 0;
    quantity: number = 0;
    userPrice: number = 0;
    packingSizeId: number = 0;
    allDay: boolean = false;
    alternateDay: boolean = false;
    specificDay: boolean = false;
    regularDay: boolean = false;
    shift: number = 1;
    sunday: boolean = false;
    monday: boolean = false;
    tuesday: boolean = false;
    wednesday: boolean = false;
    thursday: boolean = false;
    friday: boolean = false;
    saturday: boolean = false;
};
interface Product {
    id: number;
    product_name: string;
    product_image: string;
    rough_product_id: number;
    msProductType: number;
    product_type_name: string;
    rough_product_name: string;
    cgst: string;
    sgst: string;
    mrp: string;
    base_price: string;
    unit_name: string;
    st_name: string;
    created_on: string;  // ISO string
    updated_on: string | null;
    uom: number;
}

