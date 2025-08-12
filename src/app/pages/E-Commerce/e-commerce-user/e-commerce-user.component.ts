import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FileUploaderComponent } from '../../form-elements/controls/file-uploader/file-uploader.component';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '@services/Socket.service';
import State from '../../../Models/state.model';
import City from '../../../Models/city.model';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-e-commerce-user',
  standalone: true,
  imports: [
    NgxDatatableModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './e-commerce-user.component.html',
  styleUrls: ['./e-commerce-user.component.scss']
})
export class ECommerceUserComponent implements OnInit {
  userForm: FormGroup;
  rows: any[] = [];
  temp: any[] = [];
  cityList: City[];
  stateList: State[];
  isEditUser: boolean = false;
  ecommUsr: any[] = [];
  Id: number = 0;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('closeButton') closeButton: ElementRef | undefined; // refrence to the close form
  isEditMode: boolean = false;
  constructor(private fb: FormBuilder,
    private socketService: SocketService,
    private toaster: ToastrService,
    private router: Router,
    public toastr: ToastrService) {
    this.userForm = this.fb.group({
      full_name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', Validators.required],
      state: [null, Validators.required],
      city: [null, Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      facebook_page: ['', Validators.required],
      website: [''],
      about_me: ['']
    });
  }
  ngOnInit(): void {
    this.getStates();
    this.getAllEcommUsrData();
    this.updateDetails();
    this.socketService.listen('ecommerce-user:all').subscribe((res: any) => {
      if (res.success) {
        this.ecommUsr = res.data;
      }
    });

    this.socketService.listen("ecommerce-user:add").subscribe((res: any) => {
      // ("citites =>", res.data)

      if (res.success) {
        this.toaster.success(res.event, res.message)
        this.userForm.reset();
        this.closeForm();
        return
      }

      this.toaster.error(res.message)
      if (res.error == 402) {
        this.router.navigate(['/login']);
        return
      }
    })
    // get all states
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
    this.socketService.listen("ecommerce-user:update").subscribe((res: any) => {
      if (res.success) {
        this.getAllEcommUsrData();
        this.toastr.success(res.message);
        this.userForm.reset({
          full_name: '',
          mobile: '',
          email: '',
          password: '',
          address: '',
          state: '',
          city: '',
          pincode: '',
          facebook_page: '',
          website: '',
          about_me: '',
        });
        // (res.message);
        return;
      }
      this.toastr.error(res.message);

    });

    this.socketService.listen("ecommerce-user:delete").subscribe((res: any) => {
      if (res.success) {
        // this.toaster.success("Delete User", res.message);
        Swal.fire("Delete user", res.message, "success");
        this.getAllEcommUsrData();
        return;
      }

      Swal.fire("Delete user", res.message, "error");

    })

    this.socketService.listen("ecommerce-user:get-by-id").subscribe((res: any) => {
      try {
        if (res.success) {
          const { data } = res;
          this.getCities(data.state);
          this.userForm.patchValue({
            ...data,
            pincode: parseInt(data.pincode),
            city: parseFloat(data.city),
            state: parseFloat(data.state),
          });

        }
      } catch (error) {
      }
    })
  }

  // close add /update user form
  closeForm() {
    this.userForm.reset();
    this.isEditUser = false;
    this.closeButton?.nativeElement?.click();
  }

  goBack() {
    this.router.navigate(['/pages/e-commerce']);
  }

  getCities(stateId: any) {
    // (stateId);
    this.socketService.emit("location:cities", { stateId: stateId });
  }
  getStates() {
    this.socketService.emit("location:states", {})
  }

  getAllEcommUsrData() {
    this.socketService.emit('ecommerce-user:all', {});
  }

  updateDetails() {
    if (this.userForm.valid) {
      const data = { ...this.userForm.value, id: this.Id };
      this.socketService.emit("ecommerce-user:update", { ...data, Id: data.id });
    }
  }


  deleteUser(Id: number, name: string) {
    // ("delete userId =>", userId);
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
        // Listen for the response from the server
        this.socketService.emit("ecommerce-user:delete", { Id: Id });
      }
    });
  }

  onsubmit() {
    if (this.userForm.valid) {
      const formData = { ...this.userForm.value };
      this.socketService.emit('ecommerce-user:add', formData);
    } else {
      this.toaster.warning('Please fill all required fields.');
    }
  }

  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }

  editId(id: number): void {
    this.isEditMode = true;
    this.Id = id;
    this.socketService.emit('ecommerce-user:get-by-id', { Id: id });
  }

}
