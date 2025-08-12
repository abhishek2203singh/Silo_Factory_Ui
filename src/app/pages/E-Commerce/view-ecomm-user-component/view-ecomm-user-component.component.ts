import { CommonModule, NgClass } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-view-ecomm-user-component',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './view-ecomm-user-component.component.html',
  styleUrl: './view-ecomm-user-component.component.scss'
})

export class ViewEcommUserComponentComponent {
  private subscriptions: Subscription[] = [];
  userForm: FormGroup;
  stateList: any[] = [];
  cityList: any[] = [];
  data: any = [];
  userId: any;
  Details: any = {};


  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;

  constructor(private fb: FormBuilder, public baseService: BaseService, private socketService: SocketService,
    private toastr: ToastrService, private formBuilder: FormBuilder, private router: Router,
    private activatedRoute: ActivatedRoute, private actRoute: ActivatedRoute,) {

    this.userId = this.actRoute.snapshot.paramMap.get('id')
  }

  ngOnInit(): void {
    const sub = this.socketService.listen("error").subscribe((vendor: any) => {
      this.toastr.error(vendor.message);
    });
    //  this.viewEmit(this.userId);
    this.viewEmitListen();
    this.viewEmit()
  }

  viewEmitListen() {
    this.socketService.listen('ecommerce-dpt:get-data-by-id').subscribe((rowData: any) => {
      if (rowData.success) {
        this.Details = rowData.data;
      }
      else {
        this.toastr.error(rowData.message);
      }
    });
  }

  viewEmit() {
    const id = this.userId;
    this.socketService.emit("ecommerce-dpt:get-data-by-id", { id: id });
  }

  goBack() {
    this.router.navigate(['/pages/e-commerce']);
  }

}
