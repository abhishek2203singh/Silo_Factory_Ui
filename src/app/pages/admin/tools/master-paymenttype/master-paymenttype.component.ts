import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-master-paymenttype',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
  templateUrl: './master-paymenttype.component.html',
  styleUrl: './master-paymenttype.component.scss'
})
export class MasterPaymenttypeComponent implements OnInit {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  payTypeForm: FormGroup;


  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  isEditMode: boolean = false;
  paymentTypeId: number = 0;

  constructor(private socketService: SocketService, public toastr: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
    this.selection = SelectionType.checkbox;
    this.payTypeForm = this.fb.group({
      transtionModeName: ['', Validators.required]

    });
  }
  ngOnInit(): void {
    this.getAllpayType();
    this.getPayType();
    this.editPayListen();

    const sub5 = this.socketService.listen('ms-payment-type:create').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.payTypeForm.reset({
          transtionModeName: '',

        });
        this.getPayType();

        this.isEditMode = false;
      } else {
        this.toastr.error(response.message);
      }
    });


    this.socketService.listen("ms-payment-type:update").subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message);
        this.payTypeForm.reset({
          transtionModeName: '',

        });
        this.getPayType();
      }
    })

  }

  editPayListen() {

    this.socketService.listen("ms-payment-type:by-id").subscribe((res: any) => {
      const data = res.data;
      const payType = data.id;
      const { id, name } = res.data;
      this.payTypeForm.patchValue({ ...data, transtionModeName: name, paymentTypeId: id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    this.getPayType();
  }
  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }




  payType: any[] = [];
  getAllpayType() {
    this.socketService.listen('ms-payment-type:all').subscribe((res: any) => {
      if (res?.success) {
        this.payType = res.data;
        this.temp = [...this.payType];
      }

    })
  }
  getPayType() {
    this.socketService.emit('ms-payment-type:all', {});
  }

  onSubmit() {
    if (this.payTypeForm.valid) {
      const formData = { ...this.payTypeForm.value, }
      this.socketService.emit('ms-payment-type:create', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }

  updatePayType() {
    if (this.payTypeForm.valid) {
      const data = { ...this.payTypeForm.value, id: this.paymentTypeId };
      this.socketService.emit("ms-payment-type:update", { ...data, paymentTypeId: data.id });
    }
  }
  editPayType(payType: number): void {

    this.isEditMode = true;
    this.paymentTypeId = payType;
    this.socketService.emit('ms-payment-type:by-id', { paymentTypeId: payType });

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
    this.payType = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

}
