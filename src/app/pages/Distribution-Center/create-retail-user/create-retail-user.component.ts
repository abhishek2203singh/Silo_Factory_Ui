import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '@services/Socket.service';
import State from '../../../Models/state.model';
import City from '../../../Models/city.model';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-retail-user',
  standalone: true,
  imports: [NgxDatatableModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule],
  templateUrl: './create-retail-user.component.html',
  styleUrl: './create-retail-user.component.scss'
})

export class CreateRetailUserComponent implements OnInit {
  retailUserForm: FormGroup;
  cityList: City[] = [];
  temp: any[] = [];
  stateList: State[] = [];
  departmentList: Department[] = [];
  roleList: Department[] = [];
  isEditUser: boolean = false;
  retailData: any[] = [];
  isEditMode: boolean = false;
  editUserId: number = 0;
  deliveryBoyList: any[] = [];
  subscribe: Subscription[] = [];
  @ViewChild(DatatableComponent) table: DatatableComponent;
  constructor(
    private fb: FormBuilder,
    private socketService: SocketService,
    private toaster: ToastrService,
    private router: Router,
    public toastr: ToastrService,
    private datePipe: DatePipe
  ) {
    this.initForm();
  }

  private initForm() {
    this.retailUserForm = this.fb.group({
      full_name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      department_id: ["0", Validators.required],
      role_id: ["0", Validators.required],
      gender: ["male", Validators.required],
      address: ['', Validators.required],
      state: ["", Validators.required],
      city: ["", Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      facebook_id: [''],
      google_id: [''],
      about_me: [''],
      delivery_boy_id: ['']
    });

    // Add listener for role_id changes
    this.retailUserForm.get('role_id')?.valueChanges.subscribe(roleId => {
      const deliveryBoyControl = this.retailUserForm.get('delivery_boy_id');
      if (roleId === '4') {
        deliveryBoyControl?.setValidators([Validators.required]);
      } else {
        deliveryBoyControl?.clearValidators();
      }
      deliveryBoyControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.setupSocketListeners();
    this.getStates();
    this.getAllUsers();
    this.getAllDeliveryBoy();
  }

  private setupSocketListeners() {
    // Error listener
    this.subscribe.push(
      this.socketService.listen("error").subscribe((error: any) => {
        this.toastr.error(error.message);
      })
    );

    // States listener
    this.subscribe.push(
      this.socketService.listen("location:states").subscribe((res: any) => {
        if (res?.success) {
          this.stateList = res.data;
        } else {
          this.toaster.error(res.message);
          if (res.error == 402) {
            this.socketService.Logout();
          }
        }
      })
    );

    // Cities listener
    this.subscribe.push(
      this.socketService.listen("location:cities").subscribe((res: any) => {
        if (res.success) {
          this.cityList = res.data;
        } else {
          this.toaster.error(res.message);
          if (res.error == 402) {
            this.socketService.Logout();
          }
        }
      })
    );

    // User data listener
    this.subscribe.push(
      this.socketService.listen("user:by-log-user").subscribe((res: any) => {
        if (res.success) {
          this.retailData = res.data || [];
          // console.log('retailData', res.data);
          this.temp = [...this.retailData];

        } else {
          this.toaster.error(res.message);
        }
      })
    );

    // Delivery boy list listener
    this.subscribe.push(
      this.socketService.listen("user:get-delivery-boy").subscribe((res: any) => {
        if (res.success) {
          this.deliveryBoyList = res.data || [];
        } else {
          this.toaster.error(res.message);
        }
      })
    );

    // User details listener
    this.subscribe.push(
      this.socketService.listen("user:get-user-by-id").subscribe((res: any) => {
        if (res.success) {
          const { data } = res;
          this.getCities(data.state);
          this.retailUserForm.patchValue({
            ...data,
            salary: parseFloat(data.salary),
            pincode: Number(data.pincode),
            city: parseFloat(data.city),
            state: parseFloat(data.state),
            facebook_id: String(data.facebook_id),
            google_id: String(data.google_id),
            delivery_boy_id: data.delivery_boy_id
          });
          this.editUserId = data.id;
        }
      })
    );

    // Update user listener
    this.subscribe.push(
      this.socketService.listen("user:update").subscribe((res: any) => {
        if (res?.success) {
          this.toaster.success(res.message);
          this.resetForm();
          this.getAllUsers();
          this.isEditUser = false;
        } else {
          this.toaster.error(res.message);
          if (res.error == 402) {
            this.router.navigate(['/login']);
          }
        }
      })
    );

    // Customer register listener
    this.subscribe.push(
      this.socketService.listen("customer:register").subscribe((res: any) => {
        if (res.success) {
          this.toaster.success(res.event, res.message);
          this.resetForm();
          this.getAllUsers();
        } else {
          this.toaster.error(res.message);
          if (res.error == 402) {
            this.router.navigate(['/login']);
          }
        }
      })
    );

    // User register listener
    this.subscribe.push(
      this.socketService.listen("user:register").subscribe((res: any) => {
        if (res.success) {
          this.toaster.success(res.event, res.message);
          this.resetForm();
          this.getAllUsers();
        } else {
          this.toaster.error(res.message);
          if (res.error == 402) {
            this.router.navigate(['/login']);
          }
        }
      })
    );

    // Delete user listener
    this.subscribe.push(
      this.socketService.listen("user:delete").subscribe((res: any) => {
        if (res.success) {
          Swal.fire("Delete user", res.message, "success");
          this.getAllUsers();
        } else {
          Swal.fire("Delete user", res.message, "error");
        }
      })
    );
  }

  ngOnDestroy() {
    // Cleanup subscriptions
    this.subscribe.forEach(subscription => subscription.unsubscribe());
  }

  resetForm() {
    this.initForm();
    this.isEditUser = false;
    this.editUserId = 0;
  }

  onsubmit() {
    debugger
    if (!this.retailUserForm.valid) {
      this.toaster.error('Please fill all required fields correctly');
      return;
    }

    const data = { ...this.retailUserForm.value };

    if (this.retailUserForm.get('role_id')?.value === '4') {
      this.socketService.emit("customer:register", data);
    } else {
      this.socketService.emit("user:register", data);
    }
  }

  updateDetails() {
    if (!this.retailUserForm.valid) {
      this.toaster.error('Please fill all required fields correctly');
      return;
    }

    const data = { ...this.retailUserForm.value };
    this.socketService.emit("user:update", { ...data, id: this.editUserId });
  }

  getCities(stateId: any) {
    this.socketService.emit("location:cities", { stateId: stateId });
  }

  getStates() {
    this.socketService.emit("location:states", {});
  }

  getAllDeliveryBoy() {
    this.socketService.emit("user:get-delivery-boy", {});
  }

  getAllUsers() {
    this.socketService.emit("user:by-log-user", {});
  }

  editUser(userId: number): void {
    this.isEditUser = true;
    this.editUserId = userId;
    this.socketService.emit("user:get-user-by-id", { userId });
  }

  deleteUser(userId: number, name: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: ` To delete user '${name}'  , You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.socketService.emit("user:delete", { userId });
      }
    });
  }

  goBack() {
    this.router.navigate(['/pages/distribution-center']);
  }



  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter((item: any) => {
      return (
        // Basic information
        (item.full_name?.toLowerCase().includes(val)) ||
        (item.mobile?.toLowerCase().includes(val)) ||
        (item.address?.toLowerCase().includes(val)) ||
        (item.pincode?.toString().includes(val)) ||
        (item.state_name?.toLowerCase().includes(val)) ||
        (item.city_name?.toLowerCase().includes(val)) ||
        (item.facebook_id?.toLowerCase().includes(val)) ||
        (item.google_id?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val))

      );

    });
    this.retailData = temp;
    this.table.offset = 0;
  }

}

type Department = {
  id: number,
  name: string
};

export default Department;