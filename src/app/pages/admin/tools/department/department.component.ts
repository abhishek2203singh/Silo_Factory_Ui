import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { IDepartment } from '../../../../Models/dipartment';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NgToggleModule } from 'ng-toggle-button';
@Component({
  selector: 'app-department',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, FormsModule, ReactiveFormsModule, NgToggleModule],
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})
export class DepartmentComponent implements OnInit {
  DepartmentForm: FormGroup;
  departmentList: IDepartment[] = [];
  isEditDepartment: boolean = false;
  editDeparmentId: number = 0;
  temp: any[] = [];
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('openButton') openButton: ElementRef | undefined;
  @ViewChild('closeButton') closeButton: ElementRef | undefined;
  private fb = inject(FormBuilder);
  private socketService = inject(SocketService);
  private router = inject(Router);
  private toaster = inject(ToastrService);
  constructor(private datePipe: DatePipe) {
    this.DepartmentForm = this.fb.group({
      departmentName: ['', [Validators.required]],
      priorityLevel: ['0', [Validators.required]],
      departmentId: ['']
    })
  }

  ngOnInit(): void {
    // listner for error messages
    this.socketService.listen("error").subscribe((error: any) => {
      this.toaster.error(error.message);
      // ("error listner =>", error)
      if (error.error == 402) {
        this.socketService.Logout()
      }
    });
    this.getallDepartmentListen();
    this.getAllDepartmentList();
    this.onSubmitDepartmentListen();
    this.deleteUserListen();
    this.departmentDataListen();
    this.editDepartmentListen();

  }
  getallDepartmentListen() {
    this.socketService.listen('department:all').subscribe((res: any) => {
      if (res?.success) {
        this.departmentList = res.data;
        this.temp = [...res.data]; // Store a copy of the data for filtering
      }
      if (res.error == 402) {
        this.router.navigate(['/login']);
        this.toaster?.error(res.message)
      }
    });
  }
  getAllDepartmentList() {
    this.socketService.emit('department:all', {});
  }

  onSubmitDepartmentListen() {
    this.socketService.listen('ms-department:create').subscribe((res: any) => {
      // (res);
      if (res.success == true) {
        this.toaster.success(res.event, res.message);
        this.DepartmentForm.reset({});
        this.closeForm();
        this.getAllDepartmentList();
        return
      }
      this.toaster?.error(res.message)
      if (res.error == 402) {
        this.router.navigate(['/login']);
        return
      }
    })
  }
  onSubmitDepartment() {
    let data = this.DepartmentForm.value;
    if (this.DepartmentForm.valid) {
      this.socketService.emit('ms-department:create', data);
    }
  }
  deleteUserListen() {
    this.socketService.listen("ms-department:delete").subscribe((res: any) => {
      if (res.success) {
        Swal.fire("Delete user", res.message, "success");
        return;
      }

      Swal.fire("Delete user", res.message, "error");

    })
  }

  deleteUser(departmentId: number,) {
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
        this.socketService.emit("ms-department:delete", { departmentId });
      }
    });
  }
  departmentDataListen() {
    this.socketService.listen("ms-department:by-id").subscribe((res: any) => {
      if (res.success) {
        const data = res.data;
        const departmentId = data.id
        let priorityLevel1
        if (data.is_deletable == 0) {
          priorityLevel1 = "permanent"
        }
        if (data.is_deletable == 1) {
          priorityLevel1 = "temporary"
        }
        this.DepartmentForm.patchValue({ ...data, departmentName: data.name, priorityLevel: priorityLevel1, departmentId: departmentId });
      }
      this.openForm();
    })
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  editData(departmentId: number) {
    this.isEditDepartment = true;
    this.editDeparmentId = departmentId;
    this.socketService.emit("ms-department:by-id", { departmentId });
  }
  editDepartmentListen() {
    this.socketService.listen("ms-department:update").subscribe((res: any) => {
      if (res.success) {
        this.toaster.success("Update Department", res.message);
        this.getAllDepartmentList();
        this.closeForm();
        return
      }
      this.toaster.error(res.message);
    })
  }
  editDepartmentForm() {
    let formData = this.DepartmentForm.value;
    if (this.DepartmentForm.valid) {
      this.socketService.emit("ms-department:update", formData);
    }
  }

  openForm() {
    if (!this.isEditDepartment) {
      this.DepartmentForm.reset({})
    }
    this.openButton?.nativeElement?.click();
  }

  closeForm() {
    this.DepartmentForm.reset();
    this.isEditDepartment = false;
    this.editDeparmentId = 0;
    this.closeButton?.nativeElement?.click();
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    const filteredData = this.temp.filter((item: IDepartment) => {
      // Convert numeric status to string (Active/Deactive)
      const statusText = item.status === 1 ? 'active' : 'deact';
      const priorityText = item.is_deletable === 0 ? 'permanent' : 'temporary';

      // Create separate status check
      const statusMatch = val === 'active' ? item.status === 1 :
        val === 'deactive' || val === 'deact' ? item.status === 0 :
          false;

      return (
        // Search in all relevant fields
        (item.name?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        statusMatch || // Use the new status matching logic
        priorityText.includes(val) ||
        !val
      );
    });

    // update the rows
    this.departmentList = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

}
