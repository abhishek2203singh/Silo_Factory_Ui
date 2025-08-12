import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import City from '../../../../Models/city.model';
import State from '../../../../Models/state.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';
import { PrintService } from '@services/print.service';
@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {
  editing: any = {};
  CustomerForm: FormGroup;
  subscriptionDataForm: FormGroup;
  rows: any[] = [];
  temp: any[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;
  baseImgUrl: string;
  isFileUploading: boolean = false;
  uploadResult: any;
  currentPic: string = "1724994358500.png";
  cityList: City[];
  stateList: State[];
  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedDays: string[] = []; // To store selected days
  customerId: string | null = null;
  customer: any[] = [];
  iddata: any;
  sub_status: string;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  // selectedDayOption: string = 'allDay';  // Default to "All Days"
  columns = [
    { name: 'S.No.' },
    { name: 'Product' },
    { prop: 'name' },
    { name: 'Phone' },
    { name: 'Address' },
    { name: 'Amount' },
    { name: 'View' }
  ];
  row: any;
  constructor(private router: Router, private printService: PrintService, private datePipe: DatePipe, private utilityServices: UtilityService, private activatedRoute: ActivatedRoute, protected baseService: BaseService, private socketService: SocketService, private toaster: ToastrService, private fb: FormBuilder) {
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
    });
    this.baseImgUrl = this.baseService.imageurl;
    this.CustomerForm = this.fb.group({
      id: [Validators.required],
      full_name: [Validators.required],
      mobile: [Validators.required],
      email: [Validators.required],
      password: [Validators.required],
      address: [Validators.required],
      state: [null, Validators.required],
      city: [null, Validators.required],
      pincode: [Validators.required],
      deliverycharges: [Validators.required],
      status: [Validators.required],
      gender: [Validators.required],
      department_id: [Validators.required],
      role_id: [Validators.required],
    });
    this.subscriptionDataForm = this.fb.group({
      productId: ['0', [Validators.required, Validators.min(1)]],
      deliveryBoyId: ['0', [Validators.required, Validators.min(1)]],
      shift: ['0', [Validators.required, Validators.min(1)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      selectedDayOption: ['0', [Validators.required, Validators.min(1)]],
      alternateDay: ['0',],
    });
    this.editForm = this.fb.group({
      product: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      userPrice: ['', [Validators.required, Validators.min(1)]]
    });
  }
  ngOnInit(): void {
    this.customerId = this.activatedRoute.snapshot.paramMap.get('id');
    this.getListen();
    this.updateCustFormListen();
    this.getAlldata();
    this.getCustomerList();
    this.getCustomerListListen();
    this.getAllSubscription();
    this.getAllSubscriptionListen();
    // this.editDataListen();
    this.loadProducts();
    this.loadProductsListen();
    this.getDeliveryBoyList();
    this.getDeliveryBoyListListen();
    this.customerId = this.activatedRoute.snapshot.paramMap.get('id');
    // get all states 
    this.socketService.emit("location:states", {});
    const subscriber = this.socketService.listen("location:cities").subscribe((res: any) => {
      // ("citites =>", res.data)
      if (res.success) {
        this.cityList = res.data
        return
      }
      this.toaster.error(res.message)
      if (res.error == 402) {
        this.socketService.Logout()
      }
    });
    this.socketService.emit("location:states", {});
    this.socketService.listen("location:states").subscribe((res: any) => {
      // ("data : ", res.data)
      if (res?.success) {
        this.stateList = res.data
        return
      }
      this.toaster.error(res.message)
      if (res.error == 402) {
        this.socketService.Logout()
      }
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
  goBack() {
    this.router.navigate(['/pages/Distribution-Center/customer']);
  }
  getCities(stateId: any) {
    // (stateId);
    this.socketService.emit("location:cities", { stateId: stateId });
  }
  onSubmit(): void {
    if (this.subscriptionDataForm.valid) {
      // console.log('Form Submitted:', this.subscriptionDataForm.value);
      // console.log('Selected Days:', this.selectedDays);
    } else {
      // console.log('Form Invalid');
    }
  }
  onDaySelection(day: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedDays.push(day);
    } else {
      this.selectedDays = this.selectedDays.filter((d) => d !== day);
    }
  }
  async uploadFile(file: any) {
    this.isFileUploading = true;
    this.uploadResult = await this.utilityServices.uploadImageUtility(file);
    if (this.uploadResult.error) {
      Swal.fire("something went wrong", "unable to upload file !", 'warning');
      this.isFileUploading = false;
    }
    else {
      // ("uploadResult =>", this.uploadResult)
      this.currentPic = this.uploadResult.Filename;
      // ("currentPic =>", this.currentPic)
    }
    // ("file upload result=> ", this.uploadResult)
  }
  getAlldata() {
    this.socketService.emit('user:get-delivery-boy-by-id', { id: this.customerId });
  }
  getListen() {
    this.socketService.listen('user:get-delivery-boy-by-id').subscribe((res: any) => {
      if (res.success) {
        const userData = res.data[0];
        // console.log("userData: ", userData);
        // Handle profile photo
        this.currentPic = userData.profile_photo;
        this.getCities(userData.state);
        const status = userData.status === 1 ? 'Active' : 'DeActive';
        this.CustomerForm.patchValue({
          full_name: userData.full_name,
          mobile: userData.mobile,
          email: userData.email,
          password: userData.password,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          pincode: userData.pincode,
          deliverycharges: userData.deliverycharges,
          status: status,
          id: userData.id,
          gender: userData.gender,
          role_id: userData.role_id,
          department_id: userData.department_id,
        });
      } else {
        this.toaster.error(res.message);
      }
    });
  }
  getCustomerList() {
    this.socketService.emit('customer:get-by-distCen-id', {
      distribution_center_id: this.customerId
    });
  }
  getCustomerListListen() {
    this.socketService.listen('customer:get-by-distCen-id').subscribe((res: any) => {
      if (res.success) {
        this.customer = res.data;
      } else {
        this.toaster.error(res.message);
      }
    });
  }
  //--------------------- Customer Subscription -------------------------//
  subscriptionData: any[] = [];
  getAllSubscription() {
    this.socketService.emit('subscription:by-customer', { id: this.customerId });
  }
  getAllSubscriptionListen() {
    this.socketService.listen("subscription:by-customer").subscribe((res: any) => {
      if (res.success) {
        this.subscriptionData = res.data;
        if (this.subscriptionData.length > 0) {
          // Access sub_status from the first subscription object
          this.sub_status = this.subscriptionData[0]?.sub_status;  // Access 'sub_status' from the first item
        }
        // this.temp = [...this.subscriptionData]
      } else {
        this.toaster.error(res.message)
      }
    })
  }
  //--------------------- Customer Subscription -------------------------//
  // -----------------FOR PRICE EDIT------------//
  data = []; // Your data source
  selectedRow: any = null;
  editForm: FormGroup;
  submitted = false;
  onEdit(row: any) {
    this.selectedRow = row;
    this.editForm.patchValue({
      product: row.product,
      price: row.price,
      userPrice: row.userPrice
    });
  }
  onSubmitPrice() {
    this.submitted = true;
    if (this.editForm.valid) {
      // Update the selected row with the new values
      const updatedRow = { ...this.selectedRow, ...this.editForm.value };
      const index = this.rows.findIndex(r => r.id === updatedRow.id); // Assuming each row has a unique id
      if (index !== -1) {
        this.rows[index] = updatedRow; // Update the row in the data source
      }
      this.cancelEdit();
    }
  }
  cancelEdit() {
    this.selectedRow = null;
    this.editForm.reset();
    this.submitted = false;
  }
  get f() {
    return this.editForm.controls;
  }
  // -----------------FOR PRICE EDIT------------//
  // ----------Subscription------------------//
  isReturnMode: boolean = false;
  // editData(rowId: number): void {
  //   if (!rowId) {
  //     console.error("Invalid ID passed to editData:", rowId);
  //     return;
  //   }
  //   console.log("Clicked edit for subscription with ID:", rowId);
  //   this.socketService.emit("subscription:by-id", { id: rowId });
  // }
  // editDataListen(): void {
  //   this.socketService.listen("subscription:by-id").subscribe(
  //     (res: any) => {
  //       try {
  //         // Log the full response for debugging
  //         console.log("Full response from subscription:by-id:", res);
  //         // Check if the response is successful and has data
  //         if (res.success && res.event) {
  //           const data = res.event;
  //           console.log("Subscription data to process:", data);
  //           // Reset selected days and form
  //           this.selectedDays = [];
  //           this.subscriptionDataForm.reset(); // Ensure form is reset before patching
  //           // Log the value of day_selection for debugging
  //           console.log("Day selection received:", data.day_selection);
  //           // Patch the form with the basic data
  //           this.subscriptionDataForm.patchValue({
  //             productId: data.product_id || '0',
  //             deliveryBoyId: data.delivery_boy_id || '0',
  //             shift: data.shift || '0',
  //             quantity: data.quantity || '',
  //             selectedDayOption: data.day_selection !== undefined ? data.day_selection : '0'
  //           });
  //           // Handle Alternate Day (if applicable)
  //           if (data.day_selection === '2' && data.alternate_day) {
  //             this.subscriptionDataForm.patchValue({
  //               alternateDay: this.formatDate(data.alternate_day || '')
  //             });
  //           }
  //           // Handle Specific Days (if applicable)
  //           if (data.day_selection === '3') {
  //             const dayMapping: { [key: string]: number } = {
  //               sunday: data.sunday || 0,
  //               monday: data.monday || 0,
  //               tuesday: data.tuesday || 0,
  //               wednesday: data.wednesday || 0,
  //               thursday: data.thursday || 0,
  //               friday: data.friday || 0,
  //               saturday: data.saturday || 0
  //             };
  //             // Select days that are marked as 1 (true)
  //             this.selectedDays = Object.entries(dayMapping)
  //               .filter(([_, value]) => value === 1)
  //               .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
  //           }
  //           // Log the selected days and form state for debugging
  //           console.log("Selected Days:", this.selectedDays);
  //           console.log("Form values after patching:", this.subscriptionDataForm.value);
  //           // Open the form section if it's not already open
  //           const collapseElement = document.getElementById('collapseOne');
  //           if (collapseElement && !collapseElement.classList.contains('show')) {
  //             collapseElement.classList.add('show');
  //           }
  //         } else {
  //           console.error("Failed to fetch subscription data:", res.message || 'No data');
  //         }
  //       } catch (error) {
  //         console.error("Error processing subscription data:", error);
  //       }
  //     },
  //     (error) => {
  //       console.error("Socket error while listening to subscription:by-id:", error);
  //     }
  //   );
  // }
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  // Helper method to check if a day is selected
  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }
  loadProducts() {
    this.socketService.emit("products:by-product-type", { id: 3 });
  }
  namesList: any[] = [];
  loadProductsListen() {
    this.socketService.listen("products:by-product-type").subscribe((product: any) => {
      this.namesList = product.data;
    })
  }
  getDeliveryBoyList() {
    this.socketService.emit("user:get-delivery-boy", {});
  }
  deliveryBoysData: any[] = []
  getDeliveryBoyListListen() {
    this.socketService.listen("user:get-delivery-boy").subscribe((res: any) => {
      if (res.success) {
        this.deliveryBoysData = res.data;
      } else {
        this.toaster.error(res.message)
      }
    })
  }
  printFile() {
    const headers = ['Sr. No', 'Product', 'Shift', 'Delivery Agent', 'Quantity', 'Day Selection', 'Actual Price'];
    this.printService.print(headers, this.subscriptionData, (row, index) => [
      (index + 1).toString(),
      row.product_name || '',
      row.shift_name || '',
      row.delivery_boy_name || '',
      row.quantity || '',
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
  updateCustFormListen(): void {
    this.socketService.listen("user:update").subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
      } else {
        this.toaster.error(res.message);
      }
    });
  }
  onSubmitCustForm() {
    if (this.CustomerForm.valid) {
      const formData = {
        ...this.CustomerForm.value,
        profile_photo: this.currentPic,
      };
      this.socketService.emit("user:update", formData);
    } else {
      this.toaster.error("Please fill all required fields correctly");
    }
  }
  exportToCSV() {
    const headers = ['Sr. No', 'Product', 'Shift', 'Delivery Agent', 'Quantity', 'Day Selection', 'Actual Price'];
    const csvContent = [
      headers.join(','),
      ...this.subscriptionData.map((row, index) => [
        index + 1,
        row.product_name || '',
        row.shift_name || '',
        row.delivery_boy_name || '',
        row.quantity || '',
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
      ].map(item => `"${item}"`).join(','))
    ].join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURI(csvContent)}`;
    link.download = 'subscription_data.csv';
    link.click();
  }

}

