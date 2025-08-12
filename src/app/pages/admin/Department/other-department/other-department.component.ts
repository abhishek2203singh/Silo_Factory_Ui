import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { ImasterApprovals } from '../../../../Models/masterApproval';
import { ImasterEntryType } from '../../../../Models/masterEntryType';
import { Iproduct } from '../../../../Models/product';
import { Iunit } from '../../../../Models/unit';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDepartment } from '../../../../Models/dipartment';
import { IUserProfile } from '../../../../Models/departmentHead';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { InfoPanelsComponent, InfoPanelData } from '../../../dashboard/info-panels/info-panels.component';
import { PrintService } from '@services/print.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
declare var $: any; // For jQuery modal
@Component({
  selector: 'app-other-department',
  standalone: true,
  imports: [InfoPanelsComponent, CommonModule, ReactiveFormsModule, NgxDatatableModule],
  templateUrl: './other-department.component.html',
  styleUrl: './other-department.component.scss'
})
export class OtherDepartmentComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;
  otherdepartMentForm: FormGroup;
  entryTypeData: ImasterEntryType[];
  approvalData: ImasterApprovals[];
  productData: Iproduct[];
  unitData: Iunit[];
  departmentheadList: IUserProfile[];
  departmentList: IDepartment[];
  tableLength: any;
  editId: any;
  temp: any[] = [];
  selectedRow: any = null;
  ViewOtherDepartmentData: any[] = [];
  editData: any;
  resdata: any;
  infoPanels: InfoPanelData[] = [];
  currentDepartmentId: number;
  private socketService = inject(SocketService);
  public toastr = inject(ToastrService);
  public fb = inject(FormBuilder);

  constructor(private printService: PrintService, private router: Router, private datePipe: DatePipe) {
    this.otherdepartMentForm = this.fb.group({
      entryType: ['', Validators.required],
      productId: ['', Validators.required],
      unitId: ['', Validators.required],
      quantity: ['', Validators.required],
      departmentId: ['', Validators.required],
      departmentHead: ['', Validators.required],
      id: ['']
    });
  }

  ngOnInit(): void {
    const sub = this.socketService.listen("error").subscribe((vendor: any) => {
      this.toastr.error(vendor.message);
    });
    this.acceptStockListen();
    this.getAllEntryTypeListen();
    this.getAllEntryType();
    this.getMasterApprovalListen();
    this.getMasterApproval();
    this.getProductListen();
    this.getProduct();
    this.getUnitListen();
    this.getUnit();
    this.departmentListen();
    this.department();
    this.departmentheadListen();
    this.addOtherDipartmentListen();
    this.otherDepartmentListListen();
    this.otherDepartmentList();
    this.getIdListen();
    this.updateDepartmentListen();
  }

  getAllEntryTypeListen() {
    this.socketService.listen('ms-entry-type:all').subscribe((res: any) => {
      if (res.success) {
        this.entryTypeData = res.data;
      } else {
        this.toastr.error(res.message);
      }
    });
  }


  private updateInfoPanels(): void {
    const totalEntries = this.ViewOtherDepartmentData.length;
    const totalStockOut = this.countItemsByEntryId("4");
    const totalDemand = this.countItemsByEntryId("1");
    const totalStockIn = this.countItemsByEntryId("3");
    const totalRequest = this.countItemsByEntryId("2");
    const totalApproval = this.countApproval("3");

    this.infoPanels = [
      { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
      { name: 'Entries of Request', value: totalRequest, icon: 'fa fa-table', color: '#378D3B', format: 'number' },
      { name: 'Entries of Demand', value: totalDemand, icon: 'fa fa-hand-paper-o', color: '#0096A6', format: 'number' },
      { name: 'Entries of Stock (In)', value: totalStockIn, icon: 'fa fa-sign-in', color: '#606060', format: 'number' },
      { name: 'Entries of Stock (Out)', value: totalStockOut, icon: 'fa fa-sign-out', color: '#F47B00', format: 'number' },
      { name: 'Total Approved Entries', value: totalApproval, icon: 'fa fa-cubes', color: 'rgb(47, 62, 158)', format: 'number' },
    ];
  }

  getAllEntryType() {
    this.socketService.emit("ms-entry-type:all", {});
  }

  getMasterApprovalListen() {
    this.socketService.listen('ms-approval-status:all').subscribe((res: any) => {
      if (res.success) {
        this.approvalData = res.data;
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  getMasterApproval() {
    this.socketService.emit("ms-approval-status:all", {});
  }

  getProductListen() {
    this.socketService.listen('products:all').subscribe((res: any) => {
      if (res.success) {
        this.productData = res.data;
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  getProduct() {
    this.socketService.emit("products:all", {});
  }

  getUnitListen() {
    this.socketService.listen('ms-unit:all').subscribe((res: any) => {
      if (res.success) {
        this.unitData = res.data;
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  getUnit() {
    this.socketService.emit("ms-unit:all", {});
  }

  departmentheadListen() {
    this.socketService.listen("department:head").subscribe((response: any) => {
      if (response.success) {
        this.departmentheadList = response.data;
      } else {
        this.toastr.error(response.message);
        if (response.error === 402) {
          this.socketService.Logout();
        }
      }
    });
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
      // Clear the department head selection
      this.otherdepartMentForm.patchValue({ departmentHead: '' });
    } else {
      this.departmentheadList = [];
    }
  }

  departmentListen() {
    this.socketService.listen("department:all").subscribe((department: any) => {
      if (department.success) {
        this.departmentList = department.data;
        // Find Other department ID
        const otherDept = this.departmentList.find(
          dept => dept.name.toLowerCase().includes('other department')
        );
        if (otherDept) {
          this.currentDepartmentId = otherDept.id;
        }
        // ('Received department data:', department);
      } else {
        this.toastr.error(department.message);
        if (department.error === 402) {
          this.socketService.Logout();
        }
      }
    });
  }

  department() {
    this.socketService.emit("department:all", {});
  }

  addOtherDipartmentListen() {
    this.socketService.listen('other-dpt:add').subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message);
        this.resetForm();
        this.otherDepartmentList(); // Refresh the list
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  addOtherDipartment() {
    const formData = this.otherdepartMentForm.value;
    if (this.otherdepartMentForm.valid) {
      this.socketService.emit("other-dpt:add", formData);
    }
  }

  otherDepartmentListListen() {
    this.socketService.listen('other-dpt:all').subscribe((res: any) => {
      if (res.success) {
        this.ViewOtherDepartmentData = res.data;
        this.temp = [...res.data]
        this.tableLength = res.data.length;
        this.updateInfoPanels();
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  otherDepartmentList() {
    this.socketService.emit('other-dpt:all', {});
  }

  getIdListen() {
    this.socketService.listen('other-dpt:by-id').subscribe((res: any) => {
      if (res.success) {
        this.editData = res.data;
        let entryId = this.editData.entry_type_id;
        let productId = this.editData.product_id;
        let unitId = this.editData.unit_id;
        let qty = this.editData.quantity;
        let departId = +(this.editData.department_id);
        let headId = parseInt(this.editData.departmenthead_id);
        this.departmentHead(departId);
        this.otherdepartMentForm.patchValue({
          ...this.editData,
          entryType: entryId,
          productId: productId,
          unitId: unitId,
          quantity: qty,
          departmentId: departId,
          departmentHead: headId
        });

      } else {
        this.toastr.error(res.message);
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getId(otherDepartId: number) {
    this.editId = otherDepartId;
    this.socketService.emit('other-dpt:by-id', { otherDepartId });
  }
  updateDepartmentListen() {
    this.socketService.listen('other-dpt:update').subscribe((res: any) => {
      if (res.success) {
        this.resdata = res.data;
        this.toastr.success(res.message);
        this.resetForm();
        this.closeCollapse();
        this.otherDepartmentList(); // Refresh the list
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  updateDepartment() {
    const data = { ...this.otherdepartMentForm.value };
    this.socketService.emit('other-dpt:update', data);
  }

  resetForm() {
    this.otherdepartMentForm.reset({});
    this.editId = 0;
    this.departmentheadList = []; // Clear the department head list
  }

  closeCollapse() {
    const collapseElement = document.getElementById('collapseOne');
    if (collapseElement) {
      collapseElement.classList.remove('show');
    }
    this.resetForm();
  }
  private countItemsByEntryId(Id: string): number {
    return this.ViewOtherDepartmentData.filter(item => item.entry_type_id == Id).length;
  }
  private countApproval(id: string): number {
    return this.ViewOtherDepartmentData.filter(item => item.approval_status_id == id).length;
  }


  GoToInventory() {
    if (this.currentDepartmentId) {
      // Navigate with the department ID
      this.router.navigate(['/pages/department-inventory', this.currentDepartmentId]);
    } else {
      // Fallback if department ID is not available
      this.toastr.error('Department ID not found');
    }
  }





  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // Filter the data based on the search input
    const filteredData = this.temp.filter((item: any) => {
      return (
        // Basic information
        (item.entryTypeName?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        // Product-related
        (item.productName?.toLowerCase().includes(val)) ||
        (item.Department_Name?.toLowerCase().includes(val)) ||
        (item.DepartmenheadName?.toLowerCase().includes(val)) ||
        // Quantity and Unit Information
        (item.quantity?.toString().toLowerCase().includes(val)) ||
        // Manager and Approval Information
        (item.approvalname?.toLowerCase().includes(val))

      );
    });

    // Update the displayed rows
    this.ViewOtherDepartmentData = filteredData;

    // Reset to the first page when the filter changes
    this.table.offset = 0;
  }
  openQuantityModal(row: any) {
    this.selectedRow = row;
    $('#quantityInfoModal').modal('show');
  }
  acceptStock(row: any) {
    Swal.fire({
      title: 'Accept Stock Entry',
      text: `Are you sure you want to accept ${row.quantity} ${row.unitname} of ${row.productName}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Accept Stock'
    }).then((result) => {
      if (result.isConfirmed) {
        this.socketService.emit("stock-info:accept-stock", { id: row.id });
        // console.log("result", row.id);
      }
    });
  }
  acceptStockListen() {
    this.socketService.listen('stock-info:accept-stock').subscribe((res: any) => {
      if (res?.success) {
        // First show the success message
        this.toastr.success(res.message);

        // Then show the dispatched quantity if it exists
        if (res.dispatchedQuantity !== undefined) {
          Swal.fire({
            title: 'Dispatched Quantity',
            text: `The dispatched quantity is: ${res.dispatchedQuantity}`,
            icon: 'info',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
        }
      } else {
        this.toastr.error(res.message);
      }
    });
  }




  printFile() {
    const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Distributed Quantity', 'Rejected Quantity', 'Department', 'Department Head', 'Status'];
    this.printService.print(headers, this.ViewOtherDepartmentData, (row, index) => [
      (index + 1).toString(),
      row.entryTypeName,
      new Date(row.created_on).toLocaleDateString(),  // Formatted date
      row.productName,
      row.quantity,
      `${row.distributed_quantity} ${row.unitname}`,
      row.rejected_quantity,
      row.Department_Name,
      row.DepartmenheadName,
      row.approvalname,
    ]);
  }


  exportToCSV() {
    const csvData = [];
    const headers = ['Sr. No', 'Entry Type', 'Date', 'Product', 'Quantity', 'Distributed Quantity', 'Rejected Quantity', 'Department', 'Department Head', 'Status'];
    csvData.push(headers.join(','));

    this.ViewOtherDepartmentData.forEach((row, index) => {
      const rowData = [
        index + 1,  // Sr. No
        row.entryTypeName,
        new Date(row.created_on).toLocaleDateString(),  // Formatted date
        row.productName,
        row.quantity,
        `${row.distributed_quantity} ${row.unitname}`,
        row.rejected_quantity,
        row.Department_Name,
        row.DepartmenheadName,
        row.approvalname,
      ];
      csvData.push(rowData.map(item => `"${item}"`).join(',')); // Add quotes to escape commas in fields
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table_data.csv");
    document.body.appendChild(link)
      ;
    link.click();
    document.body.removeChild(link)
      ;
  }
}