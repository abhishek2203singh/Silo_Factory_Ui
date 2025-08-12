import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InfoPanelsComponent, InfoPanelData } from '../../dashboard/info-panels/info-panels.component';
import { Router } from '@angular/router';
import { NgToggleModule } from 'ng-toggle-button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-send-return-distribution-center',
  standalone: true,
  imports: [InfoPanelsComponent, NgxDatatableModule, CommonModule, ReactiveFormsModule, NgToggleModule],
  templateUrl: './send-return-distribution-center.component.html',
  styleUrl: './send-return-distribution-center.component.scss'
})
export class SendReturnDistributioncenterComponent implements OnInit {
  editing: any = {};
  infoPanels: InfoPanelData[] = [];
  temp: any[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;
  stockdeprt: any[] = [];
  id: [''];
  isEditMode: boolean = false;
  stockForm: FormGroup;
  SendQtyForm: FormGroup;
  entryList: any[] = [];
  productList: any[] = [];
  unitList: any[] = [];
  departmentList: any[] = [];
  departmentheadList: any[] = [];
  editUserId: number = 0;
  rows: any[] = [];
  latestEntryTimestamp: Date | null = null;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  @ViewChild("closeButton") closeButton: ElementRef | undefined;

  constructor(private socketService: SocketService, private toaster: ToastrService, private fb: FormBuilder, private router: Router) {
    this.stockForm = this.fb.group({
      entryType: ['', Validators.required],
      productId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitId: ['', Validators.required],
      departmentId: ['', Validators.required],
      departmentHead: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getAllStock();
    this.getStock();
    this.deleteDataListen();
    this.loadProducts();
    this.loadDepartments();
    this.loadUnits();
    this.getentry();

    this.socketService.listen('stock-dpt:by-id').subscribe((rowData: any) => {
      const { data } = rowData;
      this.stockForm.patchValue({
        entryType: Number(data.entry_type_id),
        productId: Number(data.product_id),
        quantity: Number(data.quantity),
        unitId: Number(data.unit_id),
        departmentId: Number(data.department_id),
        departmentHead: Number(data.departmenthead_id)
      });
      const departmentHeadId = data.department_id
      this.departmentHead(departmentHeadId)
    });

    this.socketService.listen('stock-dpt:by-id').subscribe((rowData: any) => {
      const { data } = rowData;
      this.SendQtyForm.patchValue({
        entryType: Number(data.entry_type_id),
        productId: Number(data.product_id),
        quantity: Number(data.quantity),
        unitId: Number(data.unit_id),
        departmentId: Number(data.department_id),
        departmentHead: Number(data.departmenthead_id)
      });
      const departmentHeadId = data.department_id
      this.departmentHead(departmentHeadId)
    });

    this.socketService.listen("stock-dpt:update").subscribe((res: any) => {
      if (res.success) {
        this.toaster.success("update quality", res.message);
        this.stockForm.reset();
      } else {
        this.toaster.error(res.message);
      }
    });

    this.socketService.listen('stock-dpt:add').subscribe((response: any) => {
      if (response.success) {
        this.toaster.success(response.message);
        this.stockForm.reset();
        this.isEditMode = false;
      } else {
        this.toaster.error(response.message);
      }
    });

    this.socketService.listen("department:head").subscribe((response: any) => {
      if (response.success) {
        this.departmentheadList = response.data;
      } else {
        this.toaster.error(response.message);
        if (response.error === 402) {
          this.socketService.Logout();
        }
      }
    });

    this.socketService.listen("ms-unit:all").subscribe((unit: any) => {
      if (unit.success) {
        this.unitList = unit.data;
      } else {
        this.toaster.error(unit.message);
        if (unit.error === 402) {
          this.socketService.Logout();
        }
      }
    });

    this.socketService.listen("products:all").subscribe((product: any) => {
      if (product.success) {
        this.productList = product.data;
      } else {
        this.toaster.error(product.message);
        this.loadingIndicator = false;
      }
    });

    this.socketService.listen("ms-entry-type:all").subscribe((vendor: any) => {
      if (vendor.success) {
        this.entryList = vendor.data;
      } else {
        this.toaster.error(vendor.message);
      }
    });

    this.socketService.listen("department:all").subscribe((department: any) => {
      if (department.success) {
        this.departmentList = department.data;
      } else {
        this.toaster.error(department.message);
        if (department.error === 402) {
          this.socketService.Logout();
        }
      }
    });
  }

  private countDemandItems(): number {
    return this.stockdeprt.filter(item => item.entryTypeName === "Demand").length;
  }

  private countApprovalStatus(): number {
    return this.stockdeprt.filter(item => item.approvalname === "In Pending").length;
  }

  private countStockIn(): number {
    return this.stockdeprt.filter(item => item.entryTypeName === "Stock IN").length;
  }

  private countActive(): number {
    return this.stockdeprt.filter(item => item.sdStatus == "1").length;
  }

  private countDeactive(): number {
    return this.stockdeprt.filter(item => item.sdStatus == "0").length;
  }

  private updateInfoPanels(): void {
    const totalEntries = this.stockdeprt.length;
    const totalDemand = this.countDemandItems();
    const pendingApproval = this.countApprovalStatus();
    const totalStock = this.countStockIn();
    const totalActive = this.countActive();
    const totalDeactive = this.countDeactive();

    this.infoPanels = [
      { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
      { name: 'Entries of Demand', value: totalDemand, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
      { name: 'Entries of Stock (IN)', value: totalStock, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
      { name: 'Pending Approval', value: pendingApproval, icon: 'fa fa-circle-o-notch', color: '#378D3B', format: 'number' },
      { name: 'Total Active', value: totalActive, icon: 'fa fa-check-circle', color: '#F47B00', format: 'number' },
      { name: 'Total Deactive', value: totalDeactive, icon: 'fa fa-ban', color: '#D22E2E', format: 'number' },
    ];
  }

  loadProducts() {
    this.socketService.emit("products:all", {});
  }

  loadDepartments() {
    this.socketService.emit("department:all", {});
  }

  loadUnits() {
    this.socketService.emit("ms-unit:all", {});
  }

  getentry() {
    this.socketService.emit("ms-entry-type:all", {});
  }

  goBack() {
    this.router.navigate(['/pages/stock-department']);
  }

  departmentHead(departmentInput: Event | number) {
    let departmentId: number;
    if (typeof departmentInput === 'number') {
      departmentId = departmentInput;
    } else {
      const target = departmentInput.target as HTMLSelectElement;
      departmentId = Number(target.value);
    }

    if (!isNaN(departmentId) && departmentId !== 0) {
      this.socketService.emit("department:head", { department_id: departmentId, role_id: [11, 3] });
    } else {
      this.departmentheadList = [];
    }
  }

  closeForm() {
    this.stockForm.reset();
    this.isEditMode = false;
    this.editUserId = 0;
    this.closeButton?.nativeElement?.click();
  }

  editProduct(sdId: number): void {
    this.isEditMode = true;
    this.editUserId = sdId;
    this.socketService.emit('stock-dpt:by-id', { id: sdId });
  }

  updateDetails() {
    if (this.stockForm.valid) {
      const data = { ...this.stockForm.value, id: this.editUserId };
      this.socketService.emit("stock-dpt:update", data);
    }
  }

  gotoView() {
    this.router.navigate(['/pages/distribution-center']);
  }

  getStock() {
    this.socketService.listen('stock-dpt:all').subscribe((res: any) => {
      if (res?.success) {
        this.stockdeprt = res.data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp) // Assuming the timestamp is provided in the response
        }));
        this.updateLatestEntryTimestamp();
        this.updateInfoPanels();
      }
    });
  }

  getAllStock() {
    this.socketService.emit('stock-dpt:all', {});
  }

  deleteDataListen() {
    this.socketService.listen('stock-dpt:delete').subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
      } else {
        this.toaster.error(res.message);
      }
    });
  }

  deleteData(id: number) {

    Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.socketService.emit('stock-dpt:delete', { id });
      }
    });

  }
  onSubmit() {
    if (this.stockForm.valid) {
      const formData = { ...this.stockForm.value };
      this.socketService.emit('stock-dpt:add', formData);
    } else {
      this.toaster.warning('Please fill all required fields.');
    }
  }

  exportToCSV() {
    const csvData = [];
    const headers = ['Sr. No', 'Entry Type Name', 'Product Name', 'Quantity', 'Approval Name', 'Status'];
    csvData.push(headers.join(','));
    this.stockdeprt.forEach((row, index) => {
      const rowData = [
        index + 1,
        row.entryTypeName,
        row.productName,
        `${row.qty} ${row.unitShortName}`,
        row.approvalname,
        row.status == "0" ? "Deactive" : "Active",
      ];
      csvData.push(rowData.map(item => `"${item}"`).join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private updateLatestEntryTimestamp(): void {
    if (this.stockdeprt.length > 0) {
      this.latestEntryTimestamp = new Date(Math.max(...this.stockdeprt.map(e => e.timestamp.getTime())));
    }
  }

  isLatestEntry(entryTimestamp: Date): boolean {
    return this.latestEntryTimestamp !== null && entryTimestamp.getTime() === this.latestEntryTimestamp.getTime();
  }

  close() {
    this.closeButton?.nativeElement.click();
  }
}