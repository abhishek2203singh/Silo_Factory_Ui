import { Component, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { PrintService } from '@services/print.service';
@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent {
  EmpForm: any;
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  customerList: any[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;
  baseImgUrl: string;
  currentPic: string = "1724994358500.png";
  id: any[];
  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  empId: any;

  constructor(private router: Router, private toaster: ToastrService, private activatedRoute: ActivatedRoute, protected baseService: BaseService, private fb: FormBuilder, private formBuilder: FormBuilder, private socketService: SocketService, private printService: PrintService) {
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
    });
    this.baseImgUrl = this.baseService.imageurl;

    {
      this.EmpForm = this.formBuilder.group({
        'id': [''],
        'full_name': [''],
        'mobile': [''],
        'email': [''],
        'password': [''],
        'address': [''],
        'state_name': [''],
        'city_name': [''],
        'pincode': [''],
        'deliverycharges': [''],
        'status': [''],
      });

    }
  }


  ngOnInit(): void {
    this.empId = this.activatedRoute.snapshot.paramMap.get("id");
    // // console.log('Employee ID:', this.empId);
    const sub = this.socketService.listen("error").subscribe((vendor: any) => {
      this.toaster.error(vendor.message);
    });
    this.getListen();
    this.getAlldata();
    this.getCustomerListListen();
    this.getCustomerList();
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

  getListen() {
    this.socketService.listen('user:get-delivery-boy-by-id').subscribe((res: any) => {
      if (res.success) {
        const userData = res.data[0]
        // // console.log('Employee Data', res.data[0]);
        const status = userData.status == 1 ? 'Active' : 'DeActive';
        this.EmpForm.patchValue({
          full_name: userData.full_name,
          mobile: userData.mobile,
          email: userData.email,
          password: userData.password,
          address: userData.address,
          state_name: userData.state_name,
          city_name: userData.city_name,
          pincode: userData.pincode,
          deliverycharges: userData.deliverycharges,
          status: status,
          id: userData.id,
        });
      } else {
        this.toaster.error(res.message);
      }
    });
  }

  getAlldata() {
    const id = this.empId
    this.socketService.emit('user:get-delivery-boy-by-id', { id: id });
  }

  goBack() {
    this.router.navigate(['/pages/delivery-person']);
  }
  getCustomerListListen() {
    this.socketService.listen("user:get-customer-by-delivery-boy").subscribe((res: any) => {
      if (res.success) {
        this.customerList = res.data
        // // console.log("amit", this.customerList);

        this.toaster.success(res.message)
      } else {
        this.toaster.error(res.message)
      }
    })
  }
  getCustomerList() {
    this.socketService.emit("user:get-customer-by-delivery-boy", { deliveryBoyID: this.empId })
  }
  printFile() {
    const headers = ['Sr. No', 'Customer', 'Product', 'Quantity', `Available Balance`, `Price`, `Shift`];
    this.printService.print(headers, this.customerList, (row, index) => [
      (index + 1).toString(),
      row.userName,
      row.product_name,
      row.quantity,
      row.userActualBalance,
      row.user_price,
      row.shift_time,
    ]);
  }

}
