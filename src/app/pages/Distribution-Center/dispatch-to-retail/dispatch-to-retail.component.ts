import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { PrintService } from '@services/print.service';
import { InfoPanelData, InfoPanelsComponent } from '../../dashboard/info-panels/info-panels.component';

@Component({
  selector: 'app-dispatch-to-retail',
  standalone: true,
  imports: [InfoPanelsComponent, NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dispatch-to-retail.component.html',
  styleUrl: './dispatch-to-retail.component.scss'
})
export class DispatchToRetailComponent {
  DispatchForm: any;
  sendDpt: any[] = [];
  infoPanels: InfoPanelData[] = [];
  latestEntryTimestamp: Date | null = null;
  data: any;
  dispatch_id: any;
  id: [''];
  Id: number = 0;



  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  actRoute = inject(ActivatedRoute)
  constructor(private socketService: SocketService, private toaster: ToastrService, private fb: FormBuilder, private formBuilder: FormBuilder, private printService: PrintService, private router: Router,
    private activatedRoute: ActivatedRoute

  ) {
    this.DispatchForm = this.formBuilder.group({
      'id': [''],
      'productName': [''],
      'qty': [''],
      'priceperUnit': [''],
      'weight_packing': [''],
      'entryTypeName': [''],
      'departmentName': [''],
      'departmentHeadName': [''],
      'weight': [''],
      dispatchedStockQty: ['', Validators.required],
      sellingPrice: ['', Validators.required],
      trnsMessage: ['', Validators.required]
    });
    this.dispatch_id = this.activatedRoute.snapshot.paramMap.get("Id") || '';
  }

  ngOnInit(): void {
    const sub = this.socketService.listen("error").subscribe((vendor: any) => {
      this.toaster.error(vendor.message);
    });
    this.getData();
    this.getAllData();
    this.onSubmitListen();
  }


  getData() {
    this.socketService.listen('distribution-dpt:get-by-id').subscribe((res: any) => {
      // // console.log('daata', res);
      if (res.success) {
        const data = res.data
        let weight = data.weight + " " + data.unitShortName;
        this.DispatchForm.patchValue({
          entryTypeName: data.entryTypeName,
          productName: data.productName,
          qty: data.quantity,
          weight_packing: data.weight_packing,
          departmentName: data.Department_Name,
          departmentHeadName: data.DepartmenheadName,
          weight,
          priceperUnit: data.priceperUnit,
          id: data.id,
        });

        this.updateLatestEntryTimestamp();
        this.updateInfoPanels();
      } else {
        console.error('Error message:', res.message);
        this.toaster.error(res.message);
      }
    });
  }

  getAllData() {
    const id = this.dispatch_id;
    // // console.log('ID:', id);
    this.socketService.emit('distribution-dpt:get-by-id', { id: id });
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
    this.router.navigate(['/pages/distribution-center']);
  }
  onSubmitListen() {
    this.socketService.listen("distribution-dpt:send-stock").subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
        this.DispatchForm.reset({});
      } else {
        this.toaster.error(res.message);
      }
    })
  }
  onSubmit() {
    if (this.DispatchForm.valid) {
      const formData = this.DispatchForm.value
      const sendDispatchFormData = {
        dispatchedStockQty: formData.dispatchedStockQty, trnsMessage: formData.trnsMessage,
        sellingPrice: formData.sellingPrice, id: formData.id
      }
      this.socketService.emit("distribution-dpt:send-stock", sendDispatchFormData)
    }
  }
}
