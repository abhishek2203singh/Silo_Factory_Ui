import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-master-payment-status',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, CommonModule],
  templateUrl: './master-payment-status.component.html',
  styleUrl: './master-payment-status.component.scss'
})
export class MasterPaymentStatusComponent implements OnInit {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  paystsForm: FormGroup;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  isEditMode: boolean = false;
  payStatusId: number = 0;

  constructor(private socketService: SocketService, private fb: FormBuilder, public toastr: ToastrService, private datePipe: DatePipe) {
    this.paystsForm = this.fb.group({
      payStatusName: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.getAllpaySts();
    this.getpaySts();
    this.editpaystsListen();

    const sub5 = this.socketService.listen('ms-payment-status:create').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.paystsForm.reset({
          payStatusName: '',

        });
        this.getpaySts();
      } else {
        this.toastr.error(response.message);
      }
    });

    this.socketService.listen("ms-payment-status:update").subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message);
        this.paystsForm.reset();
        this.getpaySts();
      } else {
        this.toastr.error(res.message);
      }
    })
  }
  ngOnDestroy(): void {

  }

  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }





  editpaystsListen() {
    this.socketService.listen("ms-payment-status:by-id").subscribe((res: any) => {
      const data = res.data;
      const id = data.payStatusId;
      this.paystsForm.patchValue({ ...data, payStatusName: data.name, payStatusId: id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    this.getpaySts();
  }

  paysts: any[] = [];
  getAllpaySts() {
    this.socketService.listen('ms-payment-status:all').subscribe((res: any) => {
      if (res?.success) {
        this.paysts = res.data;
        this.temp = [...this.paysts];
      }
    })
  }
  getpaySts() {
    this.socketService.emit('ms-payment-status:all', {});
  }
  onSubmit() {
    if (this.paystsForm.valid) {
      const formData = { ...this.paystsForm.value, }
      this.socketService.emit('ms-payment-status:create', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }

  }

  updatePaySts() {
    if (this.paystsForm.valid) {
      const data = { ...this.paystsForm.value, Id: this.payStatusId };
      this.socketService.emit("ms-payment-status:update", { ...data, payStatusId: data.Id });
    }
  }
  editPayName(payStatusId: number): void {
    this.isEditMode = true;
    this.payStatusId = payStatusId;
    this.socketService.emit('ms-payment-status:by-id', { payStatusId });

  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {
      // Convert numeric status to string (Active/Deactive) for filtering
      const statusText = item.status === 1 ? 'active' : 'deactive';
      return (
        // Search in all relevant fields
        (item.name?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        statusText.includes(val) || // Check against "active" or "deactive"
        !val
      );
    });

    // update the rows
    this.paysts = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }
}
