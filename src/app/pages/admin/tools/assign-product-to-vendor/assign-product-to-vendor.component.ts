import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { DatatableComponent, id, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { IproductType } from '../../../../Models/productType.model';
import Swal from 'sweetalert2'


@Component({
  selector: 'app-assign-product-to-vendor',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
  templateUrl: './assign-product-to-vendor.component.html',
  styleUrl: './assign-product-to-vendor.component.scss'
})
export class AssignProductToVendorComponent implements OnInit {
  isEditMode: boolean = false;
  vendorList: any[] = [];
  namesList: any[] = [];
  productTypeList: any[] = [];
  vendorProdata: any[] = [];
  packingList: any[] = [];
  temp: any[] = [];
  id: number = 0;

  productForm: FormGroup;
  // Add new properties to store full lists
  fullProductTypeList: IproductType[] = [];
  private subscriptions: Subscription[] = [];
  private productSubscription?: Subscription;
  @ViewChild(DatatableComponent) table: DatatableComponent;

  constructor(
    private socketService: SocketService,
    public toaster: ToastrService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
  ) {
    this.productForm = this.fb.group({
      vendorId: [0, Validators.required],
      productId: [0, Validators.required],
      productTypeId: [0, Validators.required],
      packingSizeId: [0, Validators.required],
      price: ['', Validators.required],

    });
  }
  ngOnInit(): void {
    this.socketService.listen("productsbyTypeId:all").subscribe((unit: any) => {
      this.namesList = unit.data;
    });
    const sub = this.socketService.listen("error").subscribe((vendor: any) => {
      this.toaster.error(vendor.message);
    });

    this.loadVendors();
    this.getProductTypes();
    this.getvendorP();
    this.getAllvendorP();

    this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
      this.packingList = unit.data;
    })

    const sub1 = this.socketService.listen("vendor:all").subscribe((vendor: any) => {
      if (vendor.success) {
        this.vendorList = vendor.data;
      } else {
        this.toaster.error(vendor.message);
      }
    });
    this.subscriptions.push(sub);

    this.socketService.listen('ms-product-type:all').subscribe((res: any) => {

      if (res.success) {
        this.productTypeList = res.data;
        // // console.log("product types =>", this.productTypeList)
        this.fullProductTypeList = [...res.data]; // Store full list
      } else {
        this.toaster.error(res.message);
      }
    });

    const sub2 = this.socketService.listen('ms-vender-product:assign').subscribe((response: any) => {
      if (response.success) {
        // // console.log(response)
        this.toaster.success(response.message);
        this.productForm.reset({
          vendorId: '',
          productId: '',
          productTypeId: '',
          packingSizeId: '',
          price: '',

        });
        this.isEditMode = false;

      } else {
        this.toaster.error(response.message);
      }
    });
    this.subscriptions.push(sub2);

    this.socketService.listen("ms-vender-product:by-id").subscribe((res: any) => {
      const data = res.data;
      const { id, vendor_id, product_id, ms_product_type_id, master_packing_size_id, price } = res.data;
      // // console.log("edit data =>", data)

      // this.socketService.emit("ms-product-type:all", {});
      this.socketService.emit("ms-packing-size:by-product-id", { productId: data.product_id });
      this.socketService.emit("productsbyTypeId:all", { ProductTypeId: ms_product_type_id })


      setTimeout(() => {
        this.productForm.patchValue({
          id: id, vendorId: vendor_id, productId: Number(product_id), productTypeId: ms_product_type_id, packingSizeId: master_packing_size_id, price: price,
        });
      }, 50);

      this.productbyproductType(data.ms_product_type_id);
      this.packinggsizebyPrdct(Number(data.product_id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    this.socketService.listen("ms-vender-product:update").subscribe((res: any) => {
      // // console.log("ms-product-type:update =< recived >", res);
      if (res.success) {

        this.toaster.success(res.message);
        this.productForm.reset({
          vendorId: '0',
          productId: '0',
          productTypeId: '0',
          packingSizeId: '0',
          price: '',
        });
        return
      }

      this.toaster.error(res.message);
    });

    this.socketService.listen("ms-vender-product:delete").subscribe((res: any) => {
      if (res.success) {
        Swal.fire("Delete user", res.message, "success");
        return;
      }
      Swal.fire("Delete user", res.message, "error");
    });
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {
      // Create separate status check
      const statusMatch = val === 'active' ? item.status === 1 :
        val === 'deactive' || val === 'deact' ? item.status === 0 :
          false;
      return (
        // Search in all relevant fields
        (item.vendor_name?.toLowerCase().toString().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        (item.product_type_name?.toLowerCase().toString().includes(val)) ||
        (item.product_name?.toLowerCase().toString().includes(val)) ||
        (item.price?.toString().includes(val)) ||
        statusMatch || // Use the new status matching logic
        // statusText.includes(val)  ||// Check against "active" or "deactive"!val
        !val
      );
    });

    // update the rows
    this.vendorProdata = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  productbyproductType(InputData: Event | any) {
    let productTypeId: number
    if (typeof InputData === "number") {
      productTypeId = InputData
    } else {
      const target = InputData.target as HTMLSelectElement;
      productTypeId = Number(target.value);
    }
    if (!isNaN(productTypeId) && productTypeId !== 0) {
      this.socketService.emit("productsbyTypeId:all", { ProductTypeId: productTypeId });
    } else {
      this.namesList = [];
    }
  }

  // Packing size data
  packinggsizebyPrdct(newInput: Event | any) {
    // // console.log('Emitting with payload:', newInput.target.value); // Debug log
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
      // // console.log("data", this.packingList)
    }


  }


  changeData(row: any) {
    const newStatus = row.status === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'activate' : 'deactivate';

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${statusText} this product for vendor ${row.vendor_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${statusText} it!`
    }).then((result) => {
      if (result.isConfirmed) {
        const updatePayload = {
          vendorId: row.vendor_id,
          productId: row.product_id,
          status: newStatus
        };

        this.socketService.emit("ms-vender-product:delete", updatePayload);
      }
    });
  }

  // deleteData(row: any) {
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: `Do you want to delete this product from vendor ${row.vendor_name}?`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#3085d6',
  //     cancelButtonColor: '#d33',
  //     confirmButtonText: 'Yes, delete it!'
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       const deletePayload = {
  //         vendorId: row.vendor_id,
  //         productId: row.product_id
  //       };

  //       this.socketService.emit("ms-vender-product:delete", deletePayload);
  //     }
  //   });
  // }
  loadVendors() {
    const roleId = 5;
    this.socketService.emit("vendor:all", { role_id: roleId });
  }
  getProductTypes() {
    this.socketService.emit("ms-product-type:all", {});
  }
  getAllvendorP() {
    this.socketService.listen('ms-vender-product:all').subscribe((res: any) => {
      if (res?.success) {
        this.vendorProdata = res.data;
        // // console.log("vendor product data=>", this.vendorProdata);
        this.temp = [...this.vendorProdata];
      }
    });
  }
  getvendorP() {
    this.socketService.emit('ms-vender-product:all', {});
  }

  editVendorPro(proVendorId: number): void {
    this.isEditMode = true;
    this.id = proVendorId;
    this.socketService.emit('ms-vender-product:by-id', { id: proVendorId });
  }
  updateVendorPro() {
    if (this.productForm.valid) {
      const data = { ...this.productForm.value, id: this.id };
      this.socketService.emit("ms-vender-product:update", { ...data, id: data.id });
    }
  }
  onSubmit() {
    if (this.productForm.valid) {
      const formData = { ...this.productForm.value }
      this.socketService.emit('ms-vender-product:assign', formData);
      ;
    }
  }

}
