import { Component, inject, ViewChild } from '@angular/core';
import { InfoPanelsComponent } from './info-panels/info-panels.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../../theme/directives/directives.module';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs/internal/Subscription';
import Swal from 'sweetalert2';

// import { InfoPanelsComponent, InfoPanelData } from '../../dashboard/info-panels/info-panels.component';

@Component({
  selector: 'app-packing-process',
  standalone: true,
  imports: [NgxChartsModule, DirectivesModule, NgxDatatableModule, FormsModule, ReactiveFormsModule],
  templateUrl: './packing-process.component.html',
  styleUrls: ['./packing-process.component.scss']
})
export class PackingProcessComponent {
  private socketService = inject(SocketService);
  Packingdata: any[] = [];
  temp: any[] = [];
  namesList: any[] = [];
  List: any[] = [];
  rows: any[] = [];
  unitList: any[] = [];
  productTypeList: any[] = [];
  packingList: any[] = [];
  loadingIndicator: boolean = true;
  PackingForm: FormGroup;
  packingUnit: any[] = [];

  private subscriptions: Subscription[] = [];



  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;

  constructor(
    public activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    public toastr: ToastrService,
    private datePipe: DatePipe,
    public toaster: ToastrService,
  ) {
    this.PackingForm = this.fb.group({
      packingMaterialId: [0,],
      productId: [0, Validators.required],
      //packingMaterialQuantity: ["", [Validators.required, Validators.min(1)]],
      unitId: [5,],
      totalPackings: [Validators.required],
      totalQantity: [Validators.required],
      packingSizeId: ['', Validators.required],

    });
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
      setTimeout(() => { this.loadingIndicator = false; }, 1500);
    });

  }

  ngOnInit(): void {
    this.getAllListen();
    this.getAllTableData();
    this.loadProducts();
    this.loadUnits();
    this.getIdFinish()

    this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
      this.packingList = unit.data;
    })


    this.socketService.listen("productsbyTypeId:all").subscribe((response: any) => {
      // // console.log("products =>", response.data)
      if (response.success) {
        this.List = response.data.filter((item: any) => item.msProductType === 2);
      }
      else {
        this.toastr.error(response.message);
        this.loadingIndicator = false;
      }
    });


    this.socketService.emit("productsbyTypeId:all", { ProductTypeId: 2 });



    this.socketService.listen("products:all").subscribe((product: any) => {
      if (product.success) {
        // Filter the namesList based on msProductType
        this.namesList = product.data.filter((item: any) => item.msProductType === 3);
      } else {
        this.toastr.error(product.message);
        this.loadingIndicator = false;
      }
    });


    this.socketService.listen("ms-unit:all").subscribe((unit: any) => {
      if (unit.success) {
        this.unitList = unit.data;
      } else {
        this.toastr.error(unit.message);
        if (unit.error === 402) {
          this.socketService.Logout();
        }
      }
    });

    this.socketService.listen('packing-process:start').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.getAllTableData();
        if (response.data) {
          this.Packingdata = [...this.Packingdata, response.data];
        }
        this.PackingForm.reset({
          productId: 0,
          packingMaterialId: 0,
          totalQantity: 0,
          totalPackings: 0,
          packingSizeId: 0,
        });
      } else {
        this.toastr.error(response.message);
      }

    });
  }

  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }

  totalProducts: number = 0;
  InProgress: number = 0;
  Finished: number = 0;
  getAllListen() {
    this.socketService.listen('packing-process:all').subscribe((res: any) => {
      if (res?.success) {
        this.Packingdata = res.data;
        this.totalProducts = this.Packingdata.filter((item: any) => item.product_name).length;
        this.InProgress = this.Packingdata.filter((item: any) => item.is_finished === false).length;
        this.Finished = this.Packingdata.filter((item: any) => item.is_finished === true).length;
        // // console.log("Packing Data:", this.Packingdata);
      }
    });
  }


  getAllTableData() {
    this.socketService.emit('packing-process:all', {});
  }

  onSubmit() {
    if (this.PackingForm.valid) {
      const formData = { ...this.PackingForm.value };
      this.socketService.emit('packing-process:start', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }

  loadProducts() {
    this.socketService.emit("products:all", {});
  }


  loadUnits() {
    this.socketService.emit("ms-unit:all", {});
  }


  getIdFinish() {
    this.socketService.listen('packing-process:finish').subscribe((res: any) => {
      // // console.log('Response received:', res);
      if (res.success) {
        this.toaster.success(res.message);
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  confirmFinish(row: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark this item as finished?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, finish it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.getId(row);
      }
    });
  }

  getId(id: number) {
    this.socketService.emit('packing-process:finish', { id });
    this.updateStatus(id);
  }

  updateStatus(id: number) {
    const row = this.Packingdata.find((item: any) => item.id === id);
    if (row) {
      row.is_finished = true;
    }
  }


  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    this.Packingdata = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }


  unitByProdId(newInput: Event | any) {
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

    this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
      this.packingList = unit.data;
      // // console.log("aaa", this.packingList);
    })
  }
  goBack(): void {
    this.router.navigate(['/pages/packaging-department']);
  }
}
