import { CommonModule } from '@angular/common';
import { NgClass } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-viewfulldetailsmyentry',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './viewfulldetailsmyentry.component.html',
  styleUrl: './viewfulldetailsmyentry.component.scss'
})
export class ViewfulldetailsmyentryComponent implements OnInit {
  imgurl: any;
  urlId: any
  public personalForm: FormGroup;
  data: any = [];
  row: any = [];
  constructor(
    public baseService: BaseService,
    private socketService: SocketService,
    private router: Router, private formBuilder: FormBuilder,
    private actRoute: ActivatedRoute, private toastr: ToastrService
  ) {
    this.imgurl = baseService.imageurl;
    this.urlId = this.actRoute.snapshot.paramMap.get('id')

  }
  ngOnInit(): void {
    this.FormListen();
    this.FormEmit();
    this.getTableData();
    this.personalForm = this.formBuilder.group({
      'salutation': [''],
      'firstname': ['', Validators.required],
      'lastname': ['', Validators.required],
      'gender': [''],
      'email': ['', Validators.compose([Validators.required, emailValidator])],
      'phone': ['', Validators.required],
      'zipcode': ['', Validators.required],
      'country': ['', Validators.required],
      'state': [''],
      'address': ['']
    });
  }

  public onSubmit(values: Object): void {
    if (this.personalForm.valid) {
      // this.router.navigate(['pages/dashboard']);
    }
  }

  FormListen() {
    this.socketService.listen("quality:get-vendordata-by-id").subscribe((res: any) => {
      this.data = res.data[0];
      if (res.success) {
        // console.log("aaaa", this.data);
      } else {
        this.toastr.error(res.message)
      }
    });

  }

  FormEmit(): void {
    const Vru_id = this.urlId
    // console.log("dadad", Vru_id);

    this.socketService.emit('quality:get-vendordata-by-id', { Vru_id });
  }
  getTableData() {
    this.socketService.emit("quality:fetchtablebyvendorId", {});
    this.socketService.listen('quality:fetchtablebyvendorId').subscribe((res: any) => {
      if (res?.success) {
        this.row = res.data;
        // console.log(this.row);
      } else {
        this.toastr.error(res.message || 'Failed to fetch table data');
      }
    });
  }
}

export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const emailRegexp = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
  if (control.value && !emailRegexp.test(control.value)) {
    return { invalidEmail: true };
  }
  return null;

}


