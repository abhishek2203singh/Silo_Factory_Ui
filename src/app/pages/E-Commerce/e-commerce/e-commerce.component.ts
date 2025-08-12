import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { InfoPanelData, InfoPanelsComponent } from '../../dashboard/info-panels/info-panels.component';
import { Subscription } from 'rxjs';
declare var $: any; // For jQuery modal
@Component({
  selector: 'app-e-commerce',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, InfoPanelsComponent],
  templateUrl: './e-commerce.component.html',
  styleUrls: ['./e-commerce.component.scss']
})
export class ECommerceComponent implements OnInit {
  ecommdeprt: any[] = [];
  editing: any = {};
  temp: any[] = [];
  selected: any[] = [];
  infoPanels: InfoPanelData[] = [];
  ViewOtherDepartmentData: any[] = [];
  entryList: any[] = [];
  productList: any[] = [];
  unitList: any[] = [];
  eUsrList: any[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;
  departmentList: any[] = [];
  currentDepartmentId: number;
  selectedRow: any = null;
  isAccordionExpanded: boolean = false;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;


  isTransactionVisible = false;
  isReturnVisible = false;
  transactionForm: FormGroup;
  ecommForm: FormGroup;

  columns = [
    { prop: 'name' },
  ];

  private subscriptions: Subscription[] = [];
  constructor(
    public baseService: BaseService,
    private socketService: SocketService,
    private toaster: ToastrService,
    private router: Router,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.selection = SelectionType.checkbox;

    this.ecommForm = this.fb.group({
      entryType: ['4'],
      productId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitId: ['', Validators.required],
      weightPerUnit: ['', Validators.required],
      pricePerUnit: ['', Validators.required],
      ecommerceUserId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadUnits();
    this.getentry();
    this.getAllEcommData();
    this.getAllEcommUsrData();
    this.loadDepartments();


    this.socketService.listen('ecommerce-dpt:all').subscribe((res: any) => {
      if (res?.success) {
        this.ecommdeprt = res.data;
        this.temp = [...this.ecommdeprt];
        this.updateInfoPanels();
      }
    });

    this.socketService.listen('ecommerce-user:all').subscribe((res: any) => {
      if (res.success) {
        this.eUsrList = res.data;
        //// console.log("ecommdata", this.eUsrList);
      }
    });

    this.socketService.listen('ecommerce-dpt:add').subscribe((response: any) => {
      if (response.success) {
        this.toaster.success(response.message);
        this.ecommForm.reset();
        // this.isEditMode = false;
      } else {
        this.toaster.error(response.message);
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
  }
  loadDepartments() {
    this.socketService.emit("department:all", {});
    this.subscriptions.push(
      this.socketService.listen("department:all").subscribe((department: any) => {
        this.departmentList = department.data;
        // Find Ecommerce department ID
        const ecommDept = this.departmentList.find(
          dept => dept.name.toLowerCase().includes('ecommerce')
        );
        if (ecommDept) {
          this.currentDepartmentId = ecommDept.id;
        }
        // ('Received department data:', department);
      })
    );
  }

  // toggleReturn(id: number) {
  //   this.isReturnVisible = true; // Show the return button
  //   this.isTransactionVisible = false; // Hide transaction section
  // }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // Filter the data based on the search input
    const filteredData = this.temp.filter((item: any) => {
      return (
        // Basic information
        (item.entryTypeName?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        // Product-related
        (item.EcommUsrName?.toLowerCase().includes(val)) ||
        (item.productName?.toLowerCase().includes(val)) ||
        (item.priceper_unit?.toString().toLowerCase().includes(val)) ||
        (item.weight_per_unit?.toString().toLowerCase().includes(val)) ||
        // Quantity and Unit Information
        (item.qty?.toString().toLowerCase().includes(val)) ||
        // Manager and Approval Information
        (item.approvalStatusName?.toLowerCase().includes(val))

      );
    });

    // Update the displayed rows
    this.ecommdeprt = filteredData;

    // Reset to the first page when the filter changes
    this.table.offset = 0;
  }

  updateValue(event: any, cell: any, row: any) {
    this.editing[row.$$index + '-' + cell] = false;
    this.ecommdeprt[row.$$index][cell] = event.target.value;
  }

  onSelect({ selected }: any) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  getAllEcommData() {
    this.socketService.emit('ecommerce-dpt:all', {});
  }

  getAllEcommUsrData() {
    this.socketService.emit('ecommerce-user:all', {});
  }
  loadProducts() {
    this.socketService.emit("products:all", {});
  }

  loadUnits() {
    this.socketService.emit("ms-unit:all", {});
  }

  getentry() {
    this.socketService.emit("ms-entry-type:all", {});
  }
  DetailsRows(id: number) {
    this.router.navigate(['/pages/view-user/' + id]);
  }

  goToInfo() {
    this.router.navigate(['/pages/ecomm-user']);
  }
  GoToVisit() {
    this.router.navigate(['/pages/stock-department']);

  }

  onEcommSubmit() {
    if (this.ecommForm.valid) {
      const formData = { ...this.ecommForm.value };
      this.socketService.emit('ecommerce-dpt:add', formData);
    } else {
      this.toaster.warning('Please fill all required fields.');
    }
  }

  private countItemsByEntryId(Id: string): number {
    return this.ecommdeprt.filter(item => item.entry_type_id == Id).length;
  }
  private countRequest(): number {
    return this.ecommdeprt.filter(item => item.entryTypeName === "Request").length;
  }

  private countApproved(): number {
    return this.ecommdeprt.filter(item => item.approvalStatusName === "Approved").length;
  }
  private countStockOutItems(): number {
    return this.ecommdeprt.filter(item => item.entryTypeName === "Stock Out").length;
  }
  private countPendingStatus(): number {
    return this.ecommdeprt.filter(item => item.approvalStatusName === "Pending").length;
  }
  private updateInfoPanels(): void {
    const totalEntries = this.ecommdeprt.length;
    const totalQtysiloBox = this.ecommdeprt.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const totalStockOut = this.countStockOutItems();
    const totalApproved = this.countApproved();
    // const totalStockIn = this.countItemsByEntryId("3");
    const totalRequest = this.countRequest();
    const pendingApproval = this.countPendingStatus();
    this.infoPanels = [
      { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
      { name: 'Quantity Available in (Ltr) ', value: totalQtysiloBox, icon: 'fa fa-cubes', color: '#D22E2E', format: 'number' },
      { name: 'Entries of Request', value: totalRequest, icon: 'fa fa-table', color: '#378D3B', format: 'number' },
      { name: 'Entries of Stock (Out)', value: totalStockOut, icon: 'fa fa-sign-out', color: '#F47B00', format: 'number' },
      { name: 'Total Approved', value: totalApproved, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
      { name: 'Pending Approval', value: pendingApproval, icon: 'fa fa-circle-o-notch', color: '#378D3B', format: 'number' },


    ];
  }



  toggleTransaction() {
    this.isTransactionVisible = !this.isTransactionVisible;
    this.isReturnVisible = false;
  }
  openReturnForm() {
    this.isReturnVisible = true;
    this.isTransactionVisible = false;
  }
  GoToInventory() {
    if (this.currentDepartmentId) {
      // Navigate with the department ID
      this.router.navigate(['/pages/department-inventory', this.currentDepartmentId]);
    } else {
      // Fallback if department ID is not available
      this.toaster.error('Department ID not found');
    }
  }
  openQuantityModal(row: any) {
    this.selectedRow = row;
    $('#quantityInfoModal').modal('show');
  }
  // Modified closeCollapse method
  closeCollapse(): void {
    this.isReturnVisible = false;

    // Use setTimeout to allow for animation if needed
    setTimeout(() => {
      this.isAccordionExpanded = false;

      // Optional: Scroll to top of the page or specific element
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }

  // Add method to open collapse if needed
  openCollapse(): void {
    this.isReturnVisible = true;
    this.isAccordionExpanded = true;
  }

  // Toggle method for complete control
  toggleReturn(state: number): void {
    if (state === 0) {
      this.closeCollapse();
    } else {
      this.openCollapse();
    }
  }
}
