import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-delivery-list',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './product-delivery-list.component.html',
  styleUrl: './product-delivery-list.component.scss'
})
export class ProductDeliveryListComponent {
  productdelivery: any [];



  constructor(private router: Router, private toaster: ToastrService, 
    private activatedRoute: ActivatedRoute, protected baseService: BaseService, private socketService: SocketService,) {
   
  }
}
