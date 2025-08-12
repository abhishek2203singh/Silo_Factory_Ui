import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { UtilityService } from '@services/utility.service';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';

@Component({
  selector: 'app-view-quality-control',
  standalone: true,
  imports: [
    NgxDatatableModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './view-quality-control.component.html',
  styleUrl: './view-quality-control.component.scss'
})
export class ViewQualityControlComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent) table!: DatatableComponent;
  rows: any[] = [];
  qc_id: any;
  qualityData: any = {};
  blockForm: FormGroup;
  subscriptions: any[] = [];
  baseImgUrl: string;
  defaultPic: string;
  isFullPageImageVisible: boolean = false;
  fullPageImageUrl: string | null = null;
  approvalData: any = {};

  constructor(
    private router: Router,
    public activatedRoute: ActivatedRoute,
    protected baseService: BaseService,
    private utilityServices: UtilityService,
    private socketService: SocketService,
    private fb: FormBuilder,
  ) {
    this.qc_id = this.activatedRoute.snapshot.paramMap.get("id");
    console.log('Quality Control ID:', this.qc_id);

    this.blockForm = this.fb.group({
      vendorId: [''],
      productId: [''],
      quantity: [''],
      unitId: [''],
      pricePerUnit: [''],
      departmentId: [''],
      departmentHeadId: ['']
    });
    this.baseImgUrl = this.baseService.imageurl;
    this.defaultPic = "bill-preview.png";
  }

  ngOnInit() {
    this.getQualityDataDetail(this.qc_id);
    this.getQcapprovalDetailbyId(this.qc_id, 'Quality_Control'); // Assuming 'Quantity_Control' is the correct db_table_name

    this.subscriptions.push(
      this.socketService.listen('quality:get-vendor-by-id').subscribe((rowData: any) => {
        this.qualityData = rowData.data;
        // console.log('Quality Data11:', this.qualityData);
      })
    );

    this.subscriptions.push(
      this.socketService.listen('quality:qc-approval-by-Id').subscribe((rowData: any) => {
        console.log("Approval Data Row:", rowData);
        this.approvalData = rowData.data;
        console.log('approval Data:', this.approvalData)
        this.rows = Array.isArray(this.approvalData) ? this.approvalData : [this.approvalData];

      })
    );
  }

  getQualityDataDetail(id: any) {
    this.socketService.emit("quality:get-vendor-by-id", { id });
  }

  getQcapprovalDetailbyId(id: any, db_table_name: string) {
    debugger
    this.socketService.emit("quality:qc-approval-by-Id", { id, db_table_name });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  calculateTotalPrice(): number {
    return this.qualityData.quantity * this.qualityData.priceper_unit;
  }

  viewImage(imageUrl: string) {
    this.fullPageImageUrl = imageUrl;
    this.isFullPageImageVisible = true;
  }

  closeFullPageImage() {
    this.isFullPageImageVisible = false;
    this.fullPageImageUrl = null;
  }

  goBack() {
    this.router.navigate(['/pages/qualitypanel']);
  }
}