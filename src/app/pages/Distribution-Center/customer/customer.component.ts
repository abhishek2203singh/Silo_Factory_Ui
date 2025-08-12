import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { InfoPanelData } from '../../dashboard/info-panels/info-panels.component';
import { InfoPanelsComponent } from '../info-panels/info-panels.component';
import { RouterModule } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { Subscriptions } from '../../../Models/subscriptions';
import Swal from 'sweetalert2';
import { InvoiceSliderComponent } from './invoice-slider/invoice-slider.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
declare var $: any; // For jQuery modal
interface NewSubscriptions {
    productId: number;
    quantity: number;
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    Deliverytype: string; // Changed to string to match select value
    deliveryTypes: {
        allDays: number;
        alternateDay: number;
        specificDay: number;
    };
}
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
    selector: 'app-customer',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, InvoiceSliderComponent, ReactiveFormsModule, FormsModule, NgxPaginationModule],
    templateUrl: './customer.component.html',
    styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit {
    pauseForm: FormGroup;
    SubscriptionsList: any[] = [];
    showScheduleForm: boolean[] = []; // Array to track form visibility for each row
    showPauseModal = false;
    pauseStartDate: string = '';
    pauseEndDate: string = '';
    checked: boolean = false;
    scheduleDates: string[] = []; // Array to store schedule dates for each row
    customerId: string; // Add this property to store customer ID
    rows: any[] = [];
    customerList: any[] = []
    deliveryBoysData: any[] = [];
    editing: any = {};
    subcription: Subscriptions;
    p = 1;
    productTypeId = 3;
    employeinsert: FormGroup;
    changeDelivery: FormGroup;
    selectedCustomerId: number = 0;
    customerData: any[] = [];
    deactivatedCustomerData: any[] = [];
    deliveryboy: any[] = [];
    showSubInfo1: boolean = false;  // Controls visibility of first table
    showSubInfo: boolean = false;   // Controls visibility of new table
    temp: any[] = [];
    tem: any[] = [];
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
    subList1: SubscriptionDetails[] = [];
    producListByType: Product[] = [];
    newSubscriptions: NewSubscriptions[] = [];
    private subscriptions: Subscription[] = [];
    // New properties for invoice
    selectedCustomers: Customer[] = [];
    showInvoice: boolean = false;
    // today: Date = new Date();
    todaydate: string;
    sub_status: string;
    days = [
        { key: 'monday', label: 'Mon' },
        { key: 'tuesday', label: 'Tue' },
        { key: 'wednesday', label: 'Wed' },
        { key: 'thursday', label: 'Thu' },
        { key: 'friday', label: 'Fri' },
        { key: 'saturday', label: 'Sat' },
        { key: 'sunday', label: 'Sun' },
    ];
    dueDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
    constructor(private router: Router, protected fb: FormBuilder, private modalService: NgbModal, private datePipe: DatePipe) {
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
        this.pauseForm = this.fb.group({
            startDate: [null, Validators.required],
            endDate: [null, Validators.required]
        }, { validators: this.dateRangeValidator });
    }
    ngOnInit(): void {
        this.showScheduleForm = new Array(this.customerData.length).fill(false);
        this.scheduleDates = new Array(this.customerData.length).fill('');
        this.todaydate = new Date().toISOString().split('T')[0];
        this.getCustomerListListen();
        this.getAllSubscriptions();
        this.getSubscriptions();
        this.getCustomerList();
        this.getDeliveryBoyList();
        this.getDeliveryBoyListListen();
        this.getDeliveryBoyData();
        this.getDeactivatedCustomerListListen();
        this.getDeactivatedCustomerList();
        this.getProductByProductTypeID();
        this.addNewSubsctiptionListen();
        this.pauseAllSubscriptionList();
        this.reactivateSubscriptionList()
        // Move the subscription to ngOnInit
        this.employeinsert.get('entryType')?.valueChanges.subscribe(value => {
            this.showTable = value !== '0' && value !== null;
        });
        this.socketService.listen('user:get-delivery-boy').subscribe(
            (res: any) => {
                if (res.success) {
                    this.deliveryboy = res.data;
                    // console.log('Data:', this.deliveryboy);
                } else {
                    console.error('Error:', res.message);
                }
            },
            (error) => {
                console.error('Error fetching delivery boys:', error);
            }
        );
        this.socketService.listen("subscription:by-customer").subscribe((response: any) => {
            if (response.success) {
                this.subList1 = response.data;
                // console.log("data", this.subList1);
                // Ensure there is at least one subscription
                if (this.subList1.length > 0) {
                    // Access sub_status from the first subscription object
                    this.sub_status = this.subList1[0]?.sub_status;  // Access 'sub_status' from the first item
                }
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
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
        const sub9 = this.socketService.listen("productsbyTypeId:all").subscribe((response: any) => {
            if (response.success) {
                this.producListByType = response.data;
                this.newSubscriptions = this.producListByType.map((prouct: Product) => {
                    return {
                        ... new NewSubscriptions(),
                        productId: prouct.id,
                        product_name: prouct.product_name,
                        userPrice: Number(prouct.mrp),
                        quantity: prouct.quantity || 1,
                    }
                })
                this.temp = [...this.producListByType]
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub9);
    }
    // newentry() {
    //   this.subTableVisible = false;
    //   this.newSubTableVisible = true;
    // }
    // Custom validator to ensure end date is after start date
    dateRangeValidator(group: FormGroup) {
        const startDate = group.get('startDate')?.value;
        const endDate = group.get('endDate')?.value;
        return startDate && endDate && new Date(startDate) < new Date(endDate)
            ? null
            : { dateRange: true };
    }
    // openPauseModal(content: any) {
    //     this.modalService.open(content, {
    //         ariaLabelledBy: 'modal-basic-title',
    //         centered: true
    //     });
    // }
    openPauseModal() {
        $('#pauseModal').modal('show');
    }
    updateValue(event: any, cell: any, cellValue: any, row: any) {
        this.editing[row.$$index + '-' + cell] = false;
        this.rows[row.$$index][cell] = event.target.value;
    }
    goToCustomerDetails() {
        this.router.navigate([`/pages/customer-details/`]);
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
    getCustomerListListen() {
        this.socketService.listen("customer:get-by-distCen-id").subscribe((res: any) => {
            if (res.success) {
                this.customerData = res.data;
                this.temp1 = [...this.customerData];
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    getCustomerList() {
        this.socketService.emit("customer:get-by-distCen-id", {});
    }
    getDeactivatedCustomerListListen() {
        this.socketService.listen("deactivated-customers:get-by-distCen-id").subscribe((res: any) => {
            if (res.success) {
                this.deactivatedCustomerData = res.data;
                this.temp2 = [...this.deactivatedCustomerData]
                // console.log("DeactivatedcustomerData", this.deactivatedCustomerData);
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    getDeactivatedCustomerList() {
        this.socketService.emit("deactivated-customers:get-by-distCen-id", {});
    }
    // onCustomerSelect(event: any): void {
    //   const selectedValue = event.target.value;
    //   if (selectedValue && selectedValue !== '0') {
    //     this.showSubInfo1 = true;  // Show first table
    //     this.showSubInfo = false;  // Hide new table
    //   } else {
    //     this.showSubInfo1 = false;
    //     this.showSubInfo = false;
    //   }
    // }
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
            id: customerId
        });
    }
    addNewSubscription() {
        const actualSubscriptions = this.newSubscriptions
            .map((sub: NewSubscriptions) => {
                if (
                    sub.productId &&
                    sub.quantity > 0 &&
                    (sub.sunday || sub.monday || sub.tuesday ||
                        sub.wednesday || sub.thursday || sub.friday || sub.saturday)
                ) {
                    return {
                        ...sub,
                        allDays: sub.allDays || 0,
                        alternateDay: sub.alternateDay || 0,
                        specificDay: sub.specificDay || 0,
                        quantity: Number(sub.quantity) // Ensure quantity is a number
                    };
                }
                return null;
            })
            .filter(sub => sub !== null);
        // Log the filtered subscriptions to check the output
        // console.log("Filtered subscriptions:", actualSubscriptions);
        if (actualSubscriptions.length === 0) {
            this.toaster.error("Please select at least one product to subscribe");
            return;
        }
        const data = {
            customerId: this.selectedCustomerId,
            subscriptions: actualSubscriptions
        };
        // Log the final data before emitting it to the socket
        // console.log("Data to be emitted:", data);
        this.socketService.emit("subscription:create", data);
    }
    addNewSubsctiptionListen() {
        this.socketService.listen("subscription:create").subscribe((response: any) => {
            if (response.success) {
                this.toaster.success(response.message);
                this.getCustomerSubscriptions(this.selectedCustomerId);
                return;
            }
            this.toaster.error(response.message);
        });
    }
    showNewInfo(): void {
        this.showSubInfo1 = false;  // Hide first table
        this.showSubInfo = true;    // Show new table
    }
    updateSubscription(): void {
        try {
            const updatedSubscriptions = this.subList1.map(row => {
                const mappedRow = {
                    id: row.id,
                    productId: row.productId,
                    userPrice: row.userPrice,
                    shift: row.shift,
                    deliveryBoyId: row.deliveryBoyId,
                    quantity: row.quantity,
                    monday: row.monday ? 1 : 0,
                    tuesday: row.tuesday ? 1 : 0,
                    wednesday: row.wednesday ? 1 : 0,
                    thursday: row.thursday ? 1 : 0,
                    friday: row.friday ? 1 : 0,
                    saturday: row.saturday ? 1 : 0,
                    sunday: row.sunday ? 1 : 0
                };
                // console.log('Original row:', row);
                // console.log('Mapped row:', mappedRow);
                return mappedRow;
            });
            // console.log('All updated subscriptions:', updatedSubscriptions);
            // Log the final payload
            const payload = {
                customerId: this.selectedCustomerId,
                subscriptions: updatedSubscriptions
            };
            // console.log('Final payload to be sent:', payload);
            if (updatedSubscriptions.length === 0) {
                console.warn('No subscriptions found to update');
                this.toaster.error('No subscriptions to update');
                return;
            }
            // Log before socket emission
            // console.log('Emitting to socket with customerId:', this.selectedCustomerId);
            this.socketService.emit('subscription:update', payload);
            // Log after socket emission
            // console.log('Socket emission completed');
        } catch (error) {
            console.error('Error in updateSubscription:', error);
            this.toaster.error('Failed to update subscriptions');
        }
    }
    pauseAllSubscription() {
        const customerId = this.selectedCustomerId;
        this.socketService.emit("subscription:stop-all", { id: customerId });
    }
    pauseAllSubscriptionList() {
        // this.pauseAllSubscriptionList();
        this.socketService.listen("subscription:stop-all").subscribe((response: any) => {
            if (response.success) {
                this.toaster.success(response.message);
                this.getCustomerSubscriptions(this.selectedCustomerId);
            } else {
                this.toaster.error(response.message);
            }
        });
    }
    reactivateSubscriptionList() {
        // this.reactivateSubscriptionList();
        this.socketService.listen("subscription:re-activate-all").subscribe((response: any) => {
            // console.log("res", response);
            if (response.success) {
                this.toaster.success(response.message);
                this.getCustomerSubscriptions(this.selectedCustomerId);
            } else {
                this.toaster.error(response.message);
            }
        });
    }
    reactivateSubscription() {
        const customerId = this.selectedCustomerId;
        // console.log("cId:", customerId);
        this.socketService.emit("subscription:re-activate-all", { customerId });
    }
    // addSubscription(): void {
    //     console.log("selected subscription =>", this.newSubscriptions);
    //     return
    //     const newSubscriptions: any[] = [];
    //     // Get all rows from the second table
    //     const rows = document.querySelectorAll('#subinfo tbody tr');
    //     rows.forEach((row: any) => {
    //         const subscription = {
    //             product_id: row.querySelector('input[name="productid"]').value,
    //             shift: row.querySelector('select[name="shift[]"]').value,
    //             delivery_boy_id: row.querySelector('select[name="deliverboy[]"]').value,
    //             quantity: row.querySelector('input[name="quantity[]"]').value,
    //             monday: row.querySelector('input[id^="m"]').checked ? 1 : 0,
    //             tuesday: row.querySelector('input[id^="t"]').checked ? 1 : 0,
    //             wednesday: row.querySelector('input[id^="w"]').checked ? 1 : 0,
    //             thursday: row.querySelector('input[id^="th"]').checked ? 1 : 0,
    //             friday: row.querySelector('input[id^="f"]').checked ? 1 : 0,
    //             saturday: row.querySelector('input[id^="s"]').checked ? 1 : 0,
    //             sunday: row.querySelector('input[id^="su"]').checked ? 1 : 0,
    //             customer_id: this.selectedCustomerId
    //         };
    //         // Validate required fields
    //         if (!subscription.product_id || !subscription.shift ||
    //             !subscription.delivery_boy_id || !subscription.quantity) {
    //             this.toaster.error('Please fill in all required fields');
    //             return;
    //         }
    //         // Validate at least one day is selected
    //         if (!(subscription.monday || subscription.tuesday || subscription.wednesday ||
    //             subscription.thursday || subscription.friday || subscription.saturday ||
    //             subscription.sunday)) {
    //             this.toaster.error('Please select at least one day');
    //             return;
    //         }
    //         newSubscriptions.push(subscription);
    //     });
    //     console.log("Subscriptions", newSubscriptions);
    //     if (newSubscriptions.length > 0) {
    //         // Emit socket event for creating new subscriptions
    //         this.socketService.emit('subscription:create', {
    //             subscriptions: newSubscriptions
    //         });
    //     }
    // }F
    getDeliveryBoyData(): void {
        this.socketService.emit('user:get-delivery-boy', {});
    }
    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
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
    getDeliveryBoyListListen() {
        this.socketService.listen("user:get-delivery-boy").subscribe((res: any) => {
            if (res.success) {
                this.deliveryBoysData = res.data;
                // console.log("deliveryBoysData", this.deliveryBoysData);
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    getDeliveryBoyList() {
        this.socketService.emit("user:get-delivery-boy", {});
    }
    // Mock API call to update customers
    updateCustomerDeliveryBoy(customerIds: number[], toDeliveryBoyId: string): void {
        // console.log('Updating customers:', customerIds, 'to delivery boy:', toDeliveryBoyId);
        // Replace with actual API call
    }
    // Toggle individual selection
    // toggleSelection(customerId: number, isSelected: boolean): void {
    //     if (isSelected) {
    //         this.selectedCustomerIds.push(customerId);
    //     } else {
    //         this.selectedCustomerIds = this.selectedCustomerIds.filter(id => id !== customerId);
    //     }
    //     this.allSelected = this.customerList.every(customer => customer.selected);
    // }
    // Handle "Select All" functionality
    selectAll(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const isChecked = inputElement.checked;
        this.allSelected = isChecked;
        this.selectedCustomerIds = isChecked ? this.customerList.map(customer => customer.id) : [];
        this.customerList.forEach(customer => (customer.selected = isChecked));
    }
    // Update selected customers to the new delivery boy
    onUpdateDeliveryBoy(): void {
        const toDeliveryBoyId = this.changeDelivery.get('toDeliveryBoy')?.value;
        if (!toDeliveryBoyId || this.selectedCustomerIds.length === 0) {
            alert('Please select customers and a new delivery boy.');
            return;
        }
        this.updateCustomerDeliveryBoy(this.selectedCustomerIds, toDeliveryBoyId);
        alert('Delivery Boy updated successfully!');
        this.resetSelections();
    }
    // Reset selections and table
    resetSelections(): void {
        this.selectedCustomerIds = [];
        this.allSelected = false;
        this.customerList.forEach(customer => (customer.selected = false));
        this.changeDelivery.get('selectAll')?.setValue(false, { emitEvent: false });
    }
    getProductByProductTypeID() {
        this.socketService.emit("productsbyTypeId:all", { ProductTypeId: 3 });
    }
    onDeliveryTypeChange(row: any) {
        switch (row.Deliverytype) {
            case 1: // All Days
                row.monday = true;
                row.tuesday = true;
                row.wednesday = true;
                row.thursday = true;
                row.friday = true;
                row.saturday = true;
                row.sunday = true;
                break;
            case 2: // Alternate Day
                // Reset all days
                this.resetDays(row);
                break;
            case 3: // Specific Day
                // Reset all days
                this.resetDays(row);
                break;
            default: // Choose (0)
                this.resetDays(row);
                break;
        }
    }
    private resetDays(row: any) {
        row.monday = false;
        row.tuesday = false;
        row.wednesday = false;
        row.thursday = false;
        row.friday = false;
        row.saturday = false;
        row.sunday = false;
    }
    // isDaysDisabled(row: NewSubscriptions): boolean {
    //     // Disable individual day selection for All Days and Alternate Days
    //     return row.Deliverytype === 1 || row.Deliverytype === 2;
    // }
    isDaysDisabled(row: any): boolean {
        return row.Deliverytype == 1; // Disabled only when All Days is selected
    }
    goback(): void {
        this.showSubInfo1 = true;  // Show first table
        this.showSubInfo = false;  // hide new table
    }
    onSubmit() {
        if (this.pauseForm.valid) {
            // Handle pause subscription logic here
            // console.log('Pause subscription from',
            //     this.pauseForm.value.startDate,
            //     'to',
            //     this.pauseForm.value.endDate
            // );
            this.modalService.dismissAll();
        }
    }
    setDeliveryPrifrence(frequency: string, productId: number) {
        this.newSubscriptions = this.newSubscriptions.map((sub: NewSubscriptions) => {
            if (productId === sub.productId) {
                // Initialize deliveryTypes if not exists
                if (!sub.deliveryTypes) {
                    sub.deliveryTypes = {
                        allDays: 0,
                        alternateDay: 0,
                        specificDay: 0
                    };
                }
                // Reset all delivery types to 0
                sub.deliveryTypes.allDays = 0;
                sub.deliveryTypes.alternateDay = 0;
                sub.deliveryTypes.specificDay = 0;
                switch (frequency) {
                    case '1':
                        sub.deliveryTypes.allDays = 1;
                        return {
                            ...sub,
                            sunday: true,
                            monday: true,
                            tuesday: true,
                            wednesday: true,
                            thursday: true,
                            friday: true,
                            saturday: true,
                            Deliverytype: frequency
                        };
                    case '2':
                        sub.deliveryTypes.alternateDay = 1;
                        return {
                            ...sub,
                            monday: true,
                            tuesday: false,
                            wednesday: true,
                            thursday: false,
                            friday: true,
                            saturday: false,
                            sunday: true,
                            Deliverytype: frequency
                        };
                    case '3':
                        sub.deliveryTypes.specificDay = 1;
                        return {
                            ...sub,
                            sunday: false,
                            monday: false,
                            tuesday: false,
                            wednesday: false,
                            thursday: false,
                            friday: false,
                            saturday: false,
                            Deliverytype: frequency
                        };
                    default:
                        return {
                            ...sub,
                            sunday: false,
                            monday: false,
                            tuesday: false,
                            wednesday: false,
                            thursday: false,
                            friday: false,
                            saturday: false,
                            Deliverytype: '0'
                        };
                }
            }
            return sub;
        });
    }
    temp1: any;
    updateActCustomerFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // Filter data
        const filteredData = this.temp1.filter((item: any) => {
            return (
                (item.full_name?.toLowerCase().toString().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (item.mobile?.toLowerCase().includes(val)) ||
                (item.address?.toLowerCase().includes(val)) ||
                (item.available_balance?.toString().includes(val)) ||
                (item.deliveryBoyName?.toLowerCase().includes(val)) ||
                !val
            )
        });
        this.customerData = filteredData;
        this.table.offset = 0; // Reset to first page after filtering
        // Trigger change detection to refresh the table
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // Filter data
        const filteredData = this.tem.filter((item: any) => {
            const statusMatch = val === '' || // If search term is empty, no filtering by status
                (item.sub_status?.toLowerCase().includes(val));
            return (
                (item.customer_name?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (item.shift_name?.toLowerCase().includes(val)) ||
                (item.product_name?.toLowerCase().includes(val)) ||
                (item.quantity?.toString().includes(val)) ||
                (item.delivery_boy_name?.toLowerCase().includes(val)) ||
                statusMatch ||
                !val
            );
        });
        this.SubscriptionsList = filteredData;
        this.table.offset = 0; // Reset to first page after filtering
        // Trigger change detection to refresh the table
    }
    temp2: any;
    updateDeActCustomerFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // Filter data
        const filteredData = this.temp2.filter((item: any) => {
            return (
                (item.full_name?.toLowerCase().toString().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (item.mobile?.toLowerCase().includes(val)) ||
                (item.address?.toLowerCase().includes(val)) ||
                (item.available_balance?.toString().includes(val)) ||
                (item.deliveryBoyName?.toLowerCase().includes(val)) ||
                !val
            )
        });
        this.deactivatedCustomerData = filteredData;
        this.table.offset = 0; // Reset to first page after filtering
        // Trigger change detection to refresh the table
    }
    successMessageShown: boolean = false;
    getAllSubscriptions() {
        this.subscriptions.push(
            this.socketService.listen('subscription:all').subscribe((res: any) => {
                if (res.success) {
                    this.SubscriptionsList = res.data;
                    // console.log("Subscriptions", this.SubscriptionsList);
                    this.tem = [...res.data];
                    // Show success message only if not shown before
                    if (!this.successMessageShown) {
                        // Show the toaster message
                        const toastRef = this.toaster.success(res.message, '', {
                            timeOut: 1000, // 1 second duration
                            progressBar: true
                        });
                        // Mark message as shown
                        this.successMessageShown = true;
                        // Optional: Reset the flag after the toast is hidden
                        setTimeout(() => {
                            this.successMessageShown = false;
                        }, 1000);
                    }
                } else {
                    this.toaster.error(res.message);
                }
            })
        );
    }
    getSubscriptions() {
        this.socketService.emit('subscription:all', {});
    }
    onDaySelect(row: any, day: string, event: any) {
        // If delivery type is "All Days", check/uncheck all days
        if (row.Deliverytype === 1) {
            this.days.forEach(d => {
                row[d.key] = true;
            });
        } else {
            row[day] = event.target.checked;
        }
        // Force table refresh
        this.table.rows = [...this.table.rows];
    }
    getDeliveryType(row: any): string {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        // Check for 'All Days'
        if (days.every(day => row[day])) {
            return 'All Days';
        }
        // Check for 'Alternate Days'
        const set1 = ['monday', 'wednesday', 'friday'];
        const set2 = ['tuesday', 'thursday', 'saturday'];
        const selectedDays = days.filter(day => row[day]);
        if (selectedDays.length > 0) {
            // If all selected days are in Set 1 or Set 2
            if (selectedDays.every(day => set1.includes(day))) {
                return `Alternate Days (Monday, Wednesday, Friday)`;
            } else if (selectedDays.every(day => set2.includes(day))) {
                return `Alternate Days (Tuesday, Thursday, Saturday)`;
            }
            // If not alternate days, return specific days
            return selectedDays
                .map(day => day.charAt(0).toUpperCase() + day.slice(1)) // Capitalize first letter
                .join(', '); // Join selected days with commas
        }
        return 'No Delivery'; // Default if no days are selected
    }
}
class NewSubscriptions {
    userId: number = 0;
    product_name: string;
    deliveryBoyId: number = 0;
    productId: number = 0;
    quantity: number = 0;
    userPrice: number = 0;
    Deliverytype: string;
    packingSizeId: number = 0;
    allDays: number;
    alternateDay: number;
    specificDay: number;
    regularDay: boolean = false;
    shift: number = 1;
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
};
interface Product {
    quantity: number;
    id: number;
    product_name: string;
    product_image: string;
    rough_product_id: number;
    msProductType: number;
    product_type_name: string;
    rough_product_name: string;
    cgst: string;
    sgst: string;
    mrp: number;
    base_price: string;
    unit_name: string;
    st_name: string;
    created_on: string;  // ISO string
    updated_on: string | null;
    uom: number;
}
type SubscriptionDetails = {
    status: string;
    sub_status: string;
    id: number;
    userId: number;
    distribution_center_id: number;
    subscription_id: number;
    customer_name: string;
    created_on: string; // ISO date string
    delivery_boy_name: string;
    productId: number;
    weight: number | null;
    packingSizeId: number | null;
    unit_name: string | null;
    sort_unit: string | null;
    product_name: string;
    allDay: boolean | null;
    alternatDay: boolean | null;
    userPrice: string; // Price as string to handle formats like "170.00"
    specificDay: string; // Could also be boolean or number depending on usage
    regularDay: number;
    quantity: number;
    deliveryBoyId: number;
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    role_id: number;
    shift: number;
    shift_name: string;
    Deliverytype: number; //
};

