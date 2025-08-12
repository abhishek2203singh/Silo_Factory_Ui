import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-master-approval-status',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
  templateUrl: './master-approval-status.component.html',
  styleUrl: './master-approval-status.component.scss'
})
export class MasterApprovalStatusComponent implements OnInit {

  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  approvalStatusForm: FormGroup;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  isEditMode: boolean = false;
  approvalStsId: number = 0;

  constructor(private socketService: SocketService, public toastr: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
    this.approvalStatusForm = this.fb.group({
      name: ['', Validators.required],
      priorityLevel: ['0', [Validators.required]],
    });
  }
  ngOnInit(): void {
    this.getAllapprovalStatus();
    this.getapprovalStatus();
    this.editapprovaldataListen();

    const sub5 = this.socketService.listen('ms-approval-status:create').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.approvalStatusForm.reset();
        this.isEditMode = false;
      } else {
        this.toastr.error(response.message);
      }
      // (response);
    });

    this.socketService.listen("ms-approval-status:update").subscribe((res: any) => {
      // ("approval status updated", res);
      if (res.success) {
        this.toastr.success(res.message);
        return;
      }
      this.approvalStatusForm.reset();
      this.toastr.error(res.message);
    })
  }


  approvalStatus: any[] = []
  getAllapprovalStatus() {
    this.socketService.listen('ms-approval-status:all').subscribe((res: any) => {
      if (res?.success) {
        this.approvalStatus = res.data;
        this.temp = [...this.approvalStatus]
      }
      // ("approvalstatus", this.approvalStatus)
    })
  }
  getapprovalStatus() {
    this.socketService.emit('ms-approval-status:all', {});
  }




  editapprovaldataListen() {
    this.socketService.listen("ms-approval-status:by-id").subscribe((res: any) => {
      // ("test approval status", res.data);
      const data = res.data;
      const approvalId = data.approvalStsId;
      let priorityLevel1
      if (data.is_deletable == 0) {
        priorityLevel1 = "permanent"
      }
      if (data.is_deletable == 1) {
        priorityLevel1 = "temporary"
      }
      this.approvalStatusForm.patchValue({ ...data, name: data.name, priorityLevel: priorityLevel1, approvalStsId: approvalId });
      window.scrollTo({ top: 0, behavior: 'smooth' });

    })
  }

  approvalId: any[] = [];
  updateApproval() {
    if (this.approvalStatusForm.valid) {
      const data = { ...this.approvalStatusForm.value, id: this.approvalStsId };
      // ("update form data =>", data);
      // console.table(this.approvalStatusForm.value)
      this.socketService.emit("ms-approval-status:update", { ...data, approvalStsId: data.id });
    }
  }

  onSubmit() {
    if (this.approvalStatusForm.valid) {
      const formData = { ...this.approvalStatusForm.value, }
      this.socketService.emit('ms-approval-status:create', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }
  editapprovalName(approvalId: number): void {
    this.isEditMode = true;
    this.approvalStsId = approvalId;
    this.socketService.emit('ms-approval-status:by-id', { approvalStsId: approvalId });
  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {
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
    this.approvalStatus = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }
}

