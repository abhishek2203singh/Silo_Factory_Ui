import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DatePipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IproductType } from '../../../../Models/productType.model';

@Component({
  selector: 'app-vendor-product-price',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, CommonModule],
  templateUrl: './vendor-product-price.component.html',
  styleUrl: './vendor-product-price.component.scss'
})
export class VendorProductPriceComponent implements OnInit {
  vendorList: any[] = [];
  productTypeList: IproductType[];
  namesList: any[] = [];
  products: any[] = [];
  packingList: any[] = [];
  isEditMode: boolean = false;
  proPriceForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private fb: FormBuilder, private datePipe: DatePipe, private router: Router, public toastr: ToastrService,
    private socketService: SocketService) {
    this.proPriceForm = this.fb.group({
      vendorId: ['', Validators.required],
      productId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      unitId: ['', Validators.required],
      packingSizeId: [0,],
      productTypeId: ['', Validators.required],
      pricePerUnit: ['', [Validators.required, Validators.min(0)]],
      departmentId: ['', Validators.required],
      departmentHeadId: [''],
      bill_image: ['']
    });
  }
  ngOnInit(): void {
    this.getProductTypes();
    this.loadVendors();
    this.allProductsListners();
    this.getAllProducts();

    const sub = this.socketService.listen("vendor:all").subscribe((vendor: any) => {
      if (vendor.success) {
        this.vendorList = vendor.data;
        // // console.log(this.vendorList);
      } else {
        this.toastr.error(vendor.message);
      }
    });
    this.subscriptions.push(sub);
    this.socketService.listen('ms-product-type:all').subscribe((res: any) => {

      if (res.success) {
        this.productTypeList = res.data;
        // // console.log("product types =>", this.productTypeList)
      } else {
        this.toastr.error(res.message);
      }
    });

  }

  allProductsListners() {
    this.subscriptions.push(this.socketService.listen('products:all').subscribe((res: any) => {
      if (res?.success) {
        this.products = res.data
        return
      }
      this.toastr.error(res.message)
      if (res.error == 402) {
        this.router.navigate(['/login']);
        return
      }
    }))
  }

  private countVendor(): number {
    return this.vendorList.filter(item => item.id).length;
  }
  loadVendors() {
    const roleId = 5;
    this.socketService.emit("vendor:all", { role_id: roleId });
  }
  updateProprice() {

  }

  onSubmit() {

  }
  getAllProducts() {
    this.socketService.emit("products:all", {})
  }
  productbyproductType(InputData: Event | any) {
    let ProductTypeId: number
    if (typeof InputData === "number") {
      ProductTypeId = InputData
    } else {
      const target = InputData.target as HTMLSelectElement
      ProductTypeId = Number(target.value)
    }

    // Only emit if we have a valid product type ID
    if (!isNaN(ProductTypeId) && ProductTypeId > 0) {
      // // console.log('Emitting with payload:', payload);  // Debug log
      this.socketService.emit("productsbyTypeId:all", { ProductTypeId: ProductTypeId });
    } else {
      // console.warn('Invalid product type ID:', productTypeId);  // Debug log
      this.namesList = [];
    }
    this.socketService.listen("productsbyTypeId:all").subscribe((unit: any) => {
      this.namesList = unit.data;

    })
  }
  packinggsizebyPrdct(newInput: Event | any) {
    let productId: number
    if (typeof newInput === "number") {
      productId = newInput
    } else {
      const target = newInput.target as HTMLSelectElement
      productId = Number(target.value)
    }
    if (!isNaN(productId) && productId !== 0) {
      this.socketService.emit("ms-packing-size:by-product-id", { productId: productId });
    } else {
      this.packingList = [];
    }


  }
  getProductTypes() {
    this.socketService.emit("ms-product-type:all", {});
  }
  editProType() {

  }
  deleteData() {

  }
}
