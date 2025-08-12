import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-master-userrole',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
  templateUrl: './master-userrole.component.html',
  styleUrl: './master-userrole.component.scss'
})
export class MasterUserroleComponent implements OnInit {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  userRoleForm: FormGroup;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  isEditMode: boolean = false;
  userRoleId: number = 0;

  constructor(private socketService: SocketService, public toastr: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
    this.userRoleForm = this.fb.group({
      name: ['', Validators.required],
      priorityLevel: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.getAlluserRole();
    this.getUserRole();
    this.editdataListen();
    this.listenForCreateResponse();
    this.listenForUpdateResponse();
  }

  private listenForCreateResponse(): void {
    this.socketService.listen('ms-role:create').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.resetForm();
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  private listenForUpdateResponse(): void {
    this.socketService.listen("ms-role:update").subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message);
        this.resetForm();
        this.getUserRole(); // Refresh the list after update
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  private resetForm(): void {
    this.userRoleForm.reset({
      name: '',
      priorityLevel: '',
    });
    this.isEditMode = false;
    this.userRoleId = 0;
  }

  role: any[] = [];
  getAlluserRole() {
    this.socketService.listen('role:all').subscribe((res: any) => {
      if (res?.success) {
        this.role = res.data;
        this.temp = res.data
      }
    });
  }

  getUserRole() {
    this.socketService.emit('role:all', {});
  }

  updateUserRole() {
    if (this.userRoleForm.valid) {
      const data = { ...this.userRoleForm.value, roleId: this.userRoleId };
      this.socketService.emit("ms-role:update", data);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }

  onSubmit() {
    if (this.userRoleForm.valid) {
      const formData = { ...this.userRoleForm.value };
      this.socketService.emit('ms-role:create', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }



  editdataListen() {
    this.socketService.listen("ms-role:by-id").subscribe((res: any) => {
      const data = res.data;
      const priorityLevel = data.is_deletable ? "temporary" : "permanent";
      this.userRoleForm.patchValue({
        name: data.name,
        priorityLevel: priorityLevel
      });
      this.userRoleId = data.id;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }



  editName(roleId: number): void {
    this.isEditMode = true;
    this.userRoleId = roleId;
    this.socketService.emit('ms-role:by-id', { roleId });
  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {
      const priorityText = item.is_deletable === 0 ? 'permanent' : 'temporary';
      return (
        // Search in all relevant fields
        (item.name?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        priorityText.includes(val) ||
        !val
      );
    });

    // update the rows
    this.role = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }
}