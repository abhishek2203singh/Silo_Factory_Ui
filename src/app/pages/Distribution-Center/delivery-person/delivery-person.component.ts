import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrintService } from '@services/print.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-delivery-person',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './delivery-person.component.html',
  styleUrls: ['./delivery-person.component.scss']
})
export class DeliverypersonComponent implements OnInit {
  EmpForm: FormGroup;
  rows: any[] = [];
  temp: any[] = [];
  deliveryboy: any[] = [];
  customerId: string; // Add this property to store customer ID
  selectedCustomerId: number = 0;
  selectedCustomerIds: number[] = [];
  allSelected: boolean = false;
  customerList: any[] = [];
  deliveryBoysData: any[] = [];
  employeinsert: FormGroup;
  selection: SelectionType;
  showSubInfo1: boolean = false;  // Controls visibility of first table
  showSubInfo: boolean = false;   // Controls visibility of new table
  toaster = inject(ToastrService);
  changeDelivery: FormGroup;
  loadingIndicator: boolean = true;
  reorderable: boolean = true;
  private subscriptions: Subscription[] = [];
  subList1: any[] = [];

  @ViewChild(DatatableComponent) table: DatatableComponent;

  constructor(private router: Router, private socketService: SocketService, private datePipe: DatePipe, public toastr: ToastrService, protected fb: FormBuilder, private printService: PrintService) {
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
  }

  ngOnInit(): void {
    this.deactiveDataListen();
    this.getAllData();
    this.listenChangeDeliveryBoy();
    this.getDeliveryBoyList();
    this.getDeliveryBoyListListen();

    const sub = this.socketService.listen("error").subscribe((error: any) => {
      this.toastr.error(error.message);
    });
    this.socketService.listen('user:get-delivery-boy').subscribe(
      (res: any) => {
        if (res.success) {
          this.deliveryboy = res.data;
          this.temp = [...this.deliveryboy]
          // console.log('Data:', this.deliveryboy);
        } else {
          console.error('Error:', res.message);
        }
      },
      (error) => {
        console.error('Error fetching delivery boys:', error);
      }
    );


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
  }


  fetch(callback: (data: any) => void): void {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      callback(JSON.parse(req.response));
    };
    req.send();
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
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        // Product-related
        (item.role_name?.toLowerCase().includes(val)) ||
        (item.productName?.toLowerCase().includes(val)) ||
        (item.full_name?.toString().toLowerCase().includes(val)) ||
        (item.mobile?.toString().toLowerCase().includes(val)) ||
        statusMatch || // Check against "active" or "deactive"
        !val
      );
    });

    // Update the displayed rows
    this.deliveryboy = filteredData;

    // Reset to the first page when the filter changes
    this.table.offset = 0;
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


  getAllData(): void {
    this.socketService.emit('user:get-delivery-boy', {});
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

  // Update the delivery boy status locally
  updateEmployeeStatus(employeeId: number, status: number): void {
    const employee = this.deliveryboy.find(emp => emp.id === employeeId);
    if (employee) {
      employee.status = status;
    }
  }

  // Deactivate/Activate delivery boy based on their current status
  deactive(id: number, status: number): void {
    this.socketService.emit('user:deactive-delivery-boy-by-id', { id, status });
  }

  deactiveDataListen() {
    this.socketService.listen('user:deactive-delivery-boy-by-id').subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message)
      } else {
        this.toastr.error(res.message)
      }
    })
  }

  onEdit(row: any): void {
    // // console.log('Edit row:', row);
  }


  onDelete(row: any): void {
    // // console.log('Delete row:', row);
    const index = this.rows.findIndex(item => item.id === row.id);
    if (index !== -1) {
      this.rows = [...this.rows.slice(0, index), ...this.rows.slice(index + 1)];
      this.temp = [...this.rows];
    }
  }

  VisitDetails(id: number) {
    this.router.navigate([`/pages/employee-details`, id]);
  }
  goToAssignDeliveyPage() {
    this.router.navigate([`/pages/assign-delivery`]);
  }

  onFromDeliverySelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const firstdeliveryBoyId = Number(target.value);
    if (!isNaN(firstdeliveryBoyId) && firstdeliveryBoyId !== 0) {
      this.socketService.emit("user:get-customer-by-delivery-boy", { deliveryBoyID: firstdeliveryBoyId });
    } else {
      this.customerList = [];
    }
  }


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


  updateCustomerDeliveryBoy(customerIds: number[], toDeliveryBoyId: string): void {
    // console.log('Updating customers:', customerIds, 'to delivery boy:', toDeliveryBoyId);
    // Replace with actual API call
  }
  // Reset selections and table
  resetSelections(): void {
    this.selectedCustomerIds = [];
    this.allSelected = false;
    this.customerList.forEach(customer => (customer.selected = false));
    this.changeDelivery.get('selectAll')?.setValue(false, { emitEvent: false });
  }

  listenChangeDeliveryBoy() {
    const subs = this.socketService.listen("customer:replace-delivery-boy").subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
        Swal.fire({
          title: 'Success',
          text: res.message,
          icon: 'success',
          confirmButtonText: 'Okay'
        })
        return
      }

      this.toaster.error(res.message);

    })
  }

  changeDeliveryBoy() {
    const customers = this.customerList.filter((customer) => customer.selected).map((data) => data.customer_id);
    if (customers?.length > 0 && this.changeDelivery.valid) {

      const data = {
        ...this.changeDelivery.value,
        customers
      }
      this.socketService.emit("customer:replace-delivery-boy", data)
    }
  }
  printFile() {
    const headers = ['Sr. No', 'Employee Type', 'Name', 'Contact No.'];
    this.printService.print(headers, this.deliveryboy, (row, index) => [
      (index + 1).toString(),
      row.role_name,
      row.full_name,
      row.mobile,


    ]);
  }

  exportToCSV() {
    const headers = ['Sr. No', 'Employee Type', 'Name', 'Contact No.'];
    const csvContent = [
      headers.join(','),
      ...this.deliveryboy.map((row, index) => [
        index + 1,
        row.role_name,
        row.full_name,
        row.mobile
      ].map(item => `"${item}"`).join(','))
    ].join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURI(csvContent)}`;
    link.download = 'delivery_boy_data.csv';
    link.click();
  }


}
