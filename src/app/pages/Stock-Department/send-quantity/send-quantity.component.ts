import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { PrintService } from '@services/print.service';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { InfoPanelData, InfoPanelsComponent } from '../../dashboard/info-panels/info-panels.component';

@Component({
  selector: 'app-send-quantity',
  standalone: true,
  imports: [InfoPanelsComponent, NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './send-quantity.component.html',
  styleUrl: './send-quantity.component.scss'
})
export class SendQuantityComponent {
  SendQtyForm: any;
  editing: any = {};
  infoPanels: InfoPanelData[] = [];
  sendDpt: any[] = [];
  latestEntryTimestamp: Date | null = null;
  editUserId: number = 0;
  data: any;
  id: [''];
  entry_id: string;
  Id: number = 0;



  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;


  constructor(private socketService: SocketService, private toaster: ToastrService, private fb: FormBuilder, private formBuilder: FormBuilder, private printService: PrintService, private router: Router,
    private activatedRoute: ActivatedRoute

  ) {
    this.SendQtyForm = this.formBuilder.group({
      'id': [''],
      'productName': [''],
      'qty': [''],
      'priceperunit': [''],
      'entryTypeName': [''],
      'departmentName': [''],
      'departmentHeadName': [''],
      'weight': [''],
      dispatchedStockQty: ['', Validators.required],
      sellingPrice: ['', Validators.required],
      trnsMessage: ['', Validators.required]
    });
    this.entry_id = this.activatedRoute.snapshot.paramMap.get("Id") || '';
  }

  ngOnInit(): void {
    const sub = this.socketService.listen("error").subscribe((vendor: any) => {
      this.toaster.error(vendor.message);
    });
    this.getStock();
    this.getAllStock();
    this.DataListen();
    this.emitData()




    this.socketService.listen('stock-dpt:send-stock-qty').subscribe((response: any) => {
      if (response.success) {
        this.toaster.success(response.message);
        this.SendQtyForm.reset();
        this.getStock()
      } else {
        this.toaster.error(response.message);
      }
    });




  }

  getStock() {
    this.socketService.listen('stock-dpt:all').subscribe((res: any) => {
      if (res.success) {
        let weight = res.data.weight + " " + res.data.unitShortName
        this.SendQtyForm.patchValue({
          entryTypeName: res.data.entryTypeName,
          productName: res.data.productName,
          qty: res.data.qty,
          pricePerUnit: res.data.pricePerUnit,
          departmentName: res.data.departmentName,
          departmentHeadName: res.data.departmentHeadName,
          weight,
          priceperunit: res.data.priceperunit,
          id: res.data.sdId,

        });
        this.updateLatestEntryTimestamp();
        this.updateInfoPanels();
      } else {
        this.toaster.error(res.message);
      }
    });
  }


  getAllStock() {
    const id = this.entry_id
    this.socketService.emit('stock-dpt:all', { id: id });
  }

  DataListen() {
    this.socketService.listen('stock-dpt:all-by-entryId').subscribe((res: any) => {
      if (res.success) {
        this.sendDpt = res.data;

        this.updateLatestEntryTimestamp();
        this.updateInfoPanels();
      } else {
        this.toaster.error(res.message)
      }

    })

  }
  emitData() {
    this.socketService.emit("stock-dpt:all-by-entryId", {});
  }

  updateValue(event: any, cell: any, row: any) {
    this.editing[row.$$index + '-' + cell] = false;
    this.sendDpt[row.$$index][cell] = event.target.value;
  }


  private updateLatestEntryTimestamp(): void {
    if (this.sendDpt.length > 0) {
    }
  }
  isLatestEntry(entryTimestamp: Date): boolean {
    return this.latestEntryTimestamp !== null && entryTimestamp.getTime() === this.latestEntryTimestamp.getTime();
  }

  private countDemandItems(): number {
    return this.sendDpt.filter(item => item.entryTypeName === "Demand").length;
  }

  private countApprovalStatus(): number {
    return this.sendDpt.filter(item => item.approvalname === "In Pending").length;
  }

  private countStockIn(): number {
    return this.sendDpt.filter(item => item.entryTypeName === "Stock IN").length;
  }

  private countActive(): number {
    return this.sendDpt.filter(item => item.sdStatus == "1").length;
  }

  private countDeactive(): number {
    return this.sendDpt.filter(item => item.sdStatus == "0").length;
  }

  private updateInfoPanels(): void {
    const totalEntries = this.sendDpt.length;
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
  goBack() {
    this.router.navigate(['/pages/stock-department']);
  }

  onSubmit() {
    if (this.SendQtyForm.valid) {
      const { id, dispatchedStockQty, sellingPrice, trnsMessage } = this.SendQtyForm.value;
      const formData = { id, dispatchedStockQty, sellingPrice, trnsMessage };
      this.socketService.emit('stock-dpt:send-stock-qty', formData);

    } else {
      this.toaster.warning('Please fill all required fields.');
    }
  }


}
