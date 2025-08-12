import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-assign-delivery-to-customer',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './assign-delivery-to-customer.component.html',
  styleUrl: './assign-delivery-to-customer.component.scss'
})
export class AssignDeliveryToCustomerComponent implements OnInit {
  selected: any[] = [];
  customers: any[] = [];
  customerData: any[] = [];
  deliveryBoy: any[] = [];
  assignForm: FormGroup
  selection: SelectionType;
  socketService = inject(SocketService);
  toaster = inject(ToastrService);
  fb = inject(FormBuilder)
  router = inject(Router)
  @ViewChild('table', { static: false }) table: any;

  constructor() {
    this.selection = SelectionType.checkbox;
    this.assignForm = this.fb.group({
      deliveryBoy: ['', Validators.required]
    })
  }
  ngOnInit(): void {
    this.getCustomerListListen();
    this.getCustomerList();
    this.getAllDataListen();
    this.getAllData();
    this.submitAssignDataListen()
  }
  onSelect(event: any) {
    if (event.selected.length > 0) {
      event.selected.forEach((selectedItem: any) => {
        const id = selectedItem.id;
        const isAlreadySelected = this.customers.some(customer => customer.customerId === id);
        if (!isAlreadySelected) {
          this.customers.push({ customerId: id });
        }
        // // console.log("this. dsfkjhdfhs", this.customers);
      });
    } else {
      // // console.log('Row unselected');
    }
  }

  getCustomerListListen() {
    this.socketService.listen("customer:get-by-distCen-id").subscribe((res: any) => {
      if (res.success) {
        this.customerData = res.data;
        // // console.log("customerData",this.customerData);

      } else {
        this.toaster.error(res.message)
      }
    })
  }
  getCustomerList() {
    this.socketService.emit("customer:get-by-distCen-id", {});
  }
  getAllDataListen() {
    this.socketService.listen("user:get-delivery-boy").subscribe((res: any) => {
      if (res.success) {
        this.deliveryBoy = res.data
      } else {
        this.toaster.error(res.message)
      }
    })
  }
  getAllData(): void {
    this.socketService.emit('user:get-delivery-boy', {});
  }
  submitAssignDataListen() {
    this.socketService.listen("customer-deliveryBoy:map-delivery-to-customer").subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message)
        this.assignForm.reset({})
        this.clearSelections()
      } else {
        this.toaster.error(res.message)
      }
    })
  }
  submitAssignData() {
    if (this.assignForm.valid) {
      const formData = this.assignForm.value;
      const customers = this.customers
      formData.customers = customers;
      this.socketService.emit("customer-deliveryBoy:map-delivery-to-customer", formData)
    }

  }
  clearSelections() {
    this.customers = [];
    this.table.selected = [];
  }
  goBack() {
    this.router.navigate(['/pages/delivery-person']);
  }
}
