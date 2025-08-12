import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PrintService } from '@services/print.service';
import { SocketService } from '@services/Socket.service';
import { InventoryService } from '@services/inventory.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { NgxDatatableModule, DatatableComponent } from '@swimlane/ngx-datatable';
import { Chart } from 'chart.js/auto';
import { Location } from '@angular/common';
import { CommonModule } from "@angular/common";
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../theme/directives/directives.module';
import { single } from '@data/charts.data';
import { UtilityService } from '@services/utility.service';
interface PurchaseDetail {
    product_name: string;
    category: string;
    product: string;
    quantity: number;
    purchaseRate: number;
    salesRate: number;
}
// interface SummaryCard {
//   value: number;
//   label: string;
// }
@Component({
    selector: 'app-department-inventory',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, NgxChartsModule, DirectivesModule],
    template: `
<div class="mb-0 text-right">
   <button class="btn btn-primary" (click)="goBack()">
   <i class="fas fa-arrow-left me-2"></i> Back
   </button>
</div>
<div class="dashboard p-4">
   <!-- Department Header -->
   <div class="row mb-4">
      <div class="col-12">
         <h1 class="mb-3">{{ departmentName | titlecase }} Inventory </h1>
      </div>
   </div>
   <div class="row">
      <div class="col-md-3 mb-3" *ngFor="let card of summaryCards">
         <div class="card h-100">
            <div class="card-body text-center">
               <h2 class="card-title mb-2">{{ card.value }}</h2>
               <p class="card-text text-muted">{{ card.label }}</p>
            </div>
         </div>
      </div>
   </div>
   
<div class="row mb-3">
   <div class="col-md-12">
      <div widget class="card border-0 box-shadow">
         <div class="card-header transparent border-0 text-muted">
            <h3 class="card-title mb-0">Stock Spaces</h3>
         </div>
         <div class="card-body widget-body" style="padding: 0;">
            <div style="display: flex; flex-wrap: wrap; gap: 20px; overflow: auto; max-height: 400px; padding: 10px;">
               <!-- Loop through stockSpaces -->
               <div *ngFor="let space of stockSpaces" class="card11" style="flex: 0 0 23%; max-width: 23%; min-width: 220px;">
                  <div class="card border rounded-lg shadow" >
                     <div class="card-body" style="flex: 1;">
                        <h5 class="card-title border-bottom pb-2 mb-3 text-primary fw-bold">
                           {{ space.product_name }}
                        </h5>
                        <div class="mt-2">
                           <p class="mb-1">
                              <strong>Available Quantity:</strong> 
                              <span class="text-muted">&nbsp;{{ space.available_qty }} {{ space.st_name }}</span>
                           </p>
                           <p class="mb-1">
                              <strong>Product Type:</strong> 
                              <span class="text-muted">&nbsp;{{ space.product_type }}</span>
                           </p>
                           <p class="mb-1">
                              <strong>Packed:</strong> 
                              <span [ngClass]="{'text-success': space.is_packed_product == '1', 'text-danger': space.is_packed_product != '1'}">
                                 {{ space.is_packed_product == "1" ? "Packed" : "Not Packed" }}
                              </span>
                           </p>
                           <p class="mb-0">
                              <strong>Hold Quantity:</strong>
                              <span class="text-muted">&nbsp;{{ space.hold_quantity }}</span>
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>


<style>
   @media (max-width: 768px) {
      .card {
         flex: 0 0 48%;
      }
   }
   @media (max-width: 480px) {
      .card {
         flex: 0 0 100%;
      }
   }
</style>


   <!-- Top Row - Purchase Details and Charts -->
   <div class="row mb-4">
      <div class="col-md-6">
         <div class="card h-100">
            <div class="card-body">
               <h3 class="card-title mb-3">Total Incoming</h3>
               <ngx-datatable #purchaseTable class="material"
               [rows]="incomingData"
               [columns]="[
               { prop: 'combined', name: 'Product & Department', 
                 cellTemplate: combinedTemplate 
               },
               { prop: 'packing-size-weight', name: 'Packing Size', 
                 cellTemplate: packingSizeWeight 
               },
               { prop: 'packed_price', name: 'Packed Price',
                
                },
               { prop: 'quantity-unit', name: 'Quantity',
                cellTemplate: productUnit
                },
               { prop: 'created_on', name: 'Date', 
                 cellTemplate: dateTemplate 
               },
               ]"
               [headerHeight]="40" [footerHeight]="50" [limit]="5" [rowHeight]="'auto'" [columnMode]="'force'"
               [reorderable]="true" [scrollbarH]="true" >
</ngx-datatable>

<!-- Template for combining fields -->
<ng-template #combinedTemplate let-row="row">
  <div>
    <strong>{{ row.product_name }}</strong> 
  </div>
</ng-template>

<!-- packing-size-weight -->
<ng-template #packingSizeWeight let-row="row">
  <div>
    <strong>{{ row?.weight !=="N/A"? row?.weight +" "+ row?.packing_sort_name:row?.weight}}</strong> 
  </div>
</ng-template>
<!-- productUnit -->
<ng-template #productUnit let-row="row">
  <div >
    <strong>{{ row?.weight !== "N/A" ? row?.quantity + " " + row?.packing_sort_name : row?.quantity + " " + row?.product_st_name }}</strong>
  </div>
</ng-template>

               <!-- Define a template to format the 'created_on' field -->
<ng-template #dateTemplate let-value="value">
  {{ value | date }}
</ng-template>
            </div>
         </div>
      </div>
      <div class="col-md-6">
         <div class="card h-100">
            <div class="card-body">
               <h3 class="card-title mb-3">Total Outgoing</h3>
               <ngx-datatable #purchaseTable class="material fixed-header"
               [rows]="outgoingData "
               [columns]="[  { prop: 'product_name', name: 'Product' },
               { prop: 'department_name', name: 'Department' },
               { prop: 'packed_price', name: 'Packed Price' },
               { prop: 'quantity', name: 'Quantity' },
               { prop: 'created_on', name: 'Date', 
      cellTemplate: dateTemplate 
    }, ]"
               [headerHeight]="40" [footerHeight]="50" [limit]="5" [rowHeight]="'auto'" [columnMode]="'force'"
               [reorderable]="true" > </ngx-datatable>
            </div>
         </div>
      </div>
   </div>
   <!-- Middle Row - Charts -->
   <div class="row mb-4">
   <div class="col-md-6">
         <div widget class="card border-0 box-shadow">
            <div class="card-header transparent border-0 text-muted">
               <h3 class="card-title mb-0">Stock Space</h3>
               <div class="widget-controls">
                  <a data-widgster="expand" href="#" class="transition"><i class="fa fa-chevron-down"></i></a>
                  <a data-widgster="collapse" href="#" class="transition"></a>
                  <a data-widgster="close" href="#" class="transition"></a>
               </div>
            </div>
            <div class="card-body widget-body">
               <div class="w-100 h-100">
                  <ngx-charts-pie-chart [scheme]="colorScheme" [results]="single" [legend]="showLegend"
                  [explodeSlices]="explodeSlices" [labels]="showLabels" [doughnut]="doughnut"
                  [gradient]="gradient" (select)="onSelect($event)">
                  </ngx-charts-pie-chart>
               </div>
            </div>
         </div>
      </div>
      <div class="col-md-6">
         <div class="card h-100">
            <div class="card-body">
               <h3 class="card-title mb-3">Stock Report</h3>
               <canvas id="salesReportChart"></canvas>
            </div>
         </div>
      </div>
   </div>
   <!-- Bottom Row - Summary Cards -->
</div>
`,
    styleUrl: './department-inventory.component.scss'
})
export class DepartmentInventoryComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(DatatableComponent) table!: DatatableComponent;
    // Chart instances
    private charts: { [key: string]: Chart } = {};
    // Inventory data properties
    incomingData: inventory[] = [];
    outgoingData: inventory[] = [];
    stockSpaces: any[] = [];
    // Department related properties
    departmentList: any[] = [];
    selectedDepartment = '';
    departmentId: number = 0;
    departmentName: string = '';
    public single: any[];
    summaryCards: any[] = [];
    // In the component class
    public showLegend: boolean = true;
    public gradient: boolean = true;
    public colorScheme: any = {
        domain: ['#2F3E9E', '#D22E2E', '#378D3B', '#0096A6', '#F47B00', '#606060']
    };
    public showLabels = true;
    public explodeSlices = false;
    public doughnut = false;
    // Table related properties
    inventoryData: [] = [];
    temp: any[] = [];
    loadingIndicator: boolean = true;

    // Purchase details data
    // purchaseDetails: PurchaseDetail[] = [
    //   { vendor: 'Vendor 1', category: '7TH ENG MED', product: 'Product 1', quantity: 3, purchaseRate: 44, salesRate: 46 },
    //   { vendor: 'Vendor 2', category: '1ST ENG MED', product: 'Product 2', quantity: 9, purchaseRate: 44, salesRate: 46 },
    //   { vendor: 'Vendor 3', category: '1ST ENG MED', product: 'Product 3', quantity: 8, purchaseRate: 44, salesRate: 46 },
    //   { vendor: 'Vendor 4', category: '1ST ENG MED', product: 'Product 4', quantity: 1, purchaseRate: 29, salesRate: 31 },
    //   { vendor: 'Vendor 5', category: '2ND ENG MED', product: 'Product 5', quantity: 3, purchaseRate: 31, salesRate: 33 }
    // ];
    private processInventoryData(data: any) {
        // Process incoming and outgoing transactions
        this.incomingData = data.incoming || [];
        // // console.log("incomingData", this.incomingData);
        this.outgoingData = data.outgoing || [];
        // // console.log("outgoingData", this.outgoingData);
        this.stockSpaces = data.stockSpaces || [];
        // console.log("stockSpaces", this.stockSpaces);
        // Prepare summary cards
        this.prepareSummaryCards();
        // Prepare pie chart data
        this.preparePieChartData();
        // // Prepare sales report chart data
        // this.prepareSalesReportChartData();
        // Reinitialize charts
        this.initializeCharts();
    }
    // Summary cards data
    private prepareSummaryCards() {
        this.summaryCards = [
            { value: this.stockSpaces.length, label: 'Total Stock Spaces' },
            { value: this.incomingData.length, label: 'Incoming Transactions' },
            { value: this.outgoingData.length, label: 'Outgoing Transactions' },
            { value: this.calculateTotalStockValue(), label: 'Total Stock Value' }
        ];
    }
    private calculateTotalStockValue(): string {
        const totalValue = this.stockSpaces.reduce((sum, space) => {
            const availableQty = parseFloat(space.available_qty || '0');
            const unitPrice = parseFloat(space.unit_price || '0');
            return sum + (availableQty * unitPrice);
        }, 0);
        return totalValue.toFixed(2);
    }
    private subscriptions: Subscription[] = [];
    constructor(
        private route: ActivatedRoute,
        private socketService: SocketService,
        private toaster: ToastrService,
        private printService: PrintService,
        private inventoryService: InventoryService,
        private location: Location,
        private util: UtilityService,
        private activatedRoute: ActivatedRoute
        // Add this

    ) {

        this.departmentId = Number(this.activatedRoute.snapshot.paramMap.get("departmentId"));
        Object.assign(this, { single });
    }
    public onSelect(event: any) {
        // // console.log(event);
    }
    ngOnInit() {
        this.GetallInventoryListen();
        this.getInventryEmit();
        // Handle route params for department ID
        this.route.queryParams.subscribe(params => {
            this.departmentId = +params['deptId'];
            if (this.departmentId) {
                this.loadDepartmentInfo();
                this.loadInventoryData();
            }
        });
        // Load departments and listen for updates
        this.loadDepartments();
        this.listenToInventoryUpdates();
        // Get department name from route parameters if available
        const routeDeptName = this.route.snapshot.paramMap.get('departmentName');
        if (routeDeptName) {
            this.departmentName = routeDeptName;
            this.fetchInventoryData();
        }
        // Listen for department data
        const departmentSub = this.socketService.listen("department:all").subscribe((response: any) => {
            if (response.success) {
                this.departmentList = response.data;
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(departmentSub);
        // Add window reload event listener
        window.addEventListener('load', () => this.initializeCharts());
    }
    GetallInventoryListen() {
        this.socketService.listen('stock-info:inventories').subscribe((res: any) => {
            if (res.success) {
                console.log("data =>", res.data)
                this.inventoryData = res.data;
                this.processInventoryData(res.data);
                // console.log("inventories", this.inventoryData);
                this.temp = this.inventoryData;
            }
        });
    }
    getInventryEmit() {
        const isAdminLogin = this.util.getCurrentUser().id == 1;
        if (isAdminLogin) {
            this.socketService.emit('stock-info:inventories', { departmentId: this.departmentId });
            return
        }
        this.socketService.emit('stock-info:inventories', {});
    }
    ngAfterViewInit(): void {
        // Initialize charts with a small delay to ensure DOM elements are ready
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }
    private initializeCharts(): void {
        // Destroy existing charts first
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
        // Initialize all charts
        this.createSalesReportChart();
        this.createProductDetailsChart();
        this.createCategoryWiseSalesChart();
        this.createCategoryWiseQuotationChart();
    }
    createSalesReportChart() {
        // Prepare labels and data from incoming and outgoing transactions
        const productMap = new Map<string, { incoming: number, outgoing: number }>();

        // Process incoming data
        this.incomingData.forEach(item => {
            const productName = item.product_name || 'Unknown';
            const quantity = parseFloat(String(item.quantity)) || 0;

            if (!productMap.has(productName)) {
                productMap.set(productName, { incoming: 0, outgoing: 0 });
            }

            const currentData = productMap.get(productName)!;
            productMap.set(productName, {
                ...currentData,
                incoming: currentData.incoming + quantity
            });
        });

        // Process outgoing data
        this.outgoingData.forEach(item => {
            const productName = item.product_name || 'Unknown';
            const quantity = parseFloat(String(item.quantity)) || 0;

            if (!productMap.has(productName)) {
                productMap.set(productName, { incoming: 0, outgoing: 0 });
            }

            const currentData = productMap.get(productName)!;
            productMap.set(productName, {
                ...currentData,
                outgoing: currentData.outgoing + quantity
            });
        });

        // Prepare chart data
        const labels: string[] = [];
        const incomingData: number[] = [];
        const outgoingData: number[] = [];

        productMap.forEach((value, key) => {
            labels.push(key);
            incomingData.push(value.incoming);
            outgoingData.push(value.outgoing);
        });

        // Create or update the chart
        const ctx = document.getElementById('salesReportChart') as HTMLCanvasElement;

        // Destroy existing chart if it exists
        if (this.charts['salesReport']) {
            this.charts['salesReport'].destroy();
        }

        // Create new chart
        this.charts['salesReport'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Incoming Quantity',
                        data: incomingData,
                        backgroundColor: '#17a2b8'
                    },
                    {
                        label: 'Outgoing Quantity',
                        data: outgoingData,
                        backgroundColor: '#5eb572'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Products'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Quantity'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Product Incoming vs Outgoing Quantities'
                    }
                }
            }
        });
    }
    createProductDetailsChart() {
        const ctx = document.getElementById('productDetailsChart') as HTMLCanvasElement;
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Product 1', 'Product 2', 'Product 3', 'Product 4', 'Product 5', 'Product 6', 'Product 7'],
                datasets: [{
                    data: [20, 15, 10, 25, 10, 15, 5],
                    backgroundColor: [
                        '#007bff', '#5eb572', '#ffc107', '#17a2b8', '#dc3545', '#6c757d', '#20c997'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }
    createCategoryWiseSalesChart() {
        const ctx = document.getElementById('categoryWiseSalesChart') as HTMLCanvasElement;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
                datasets: [{
                    label: 'Sales (%)',
                    data: [14, 4, 6, 13],
                    backgroundColor: '#5eb572'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y'
            }
        });
    }
    createCategoryWiseQuotationChart() {
        const ctx = document.getElementById('categoryWiseQuotationChart') as HTMLCanvasElement;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'],
                datasets: [{
                    label: 'Quotation',
                    data: [159, 33, 2, 14, 2],
                    backgroundColor: '#5eb572'
                }]
            },
            options: {
                responsive: true
            }
        });
    }
    // ... (keep all the chart creation methods and other existing methods)
    loadDepartmentInfo() {
        this.socketService.emit('department:by-id', { id: this.departmentId });
        const sub = this.socketService.listen('department:by-id').subscribe(
            (response: any) => {
                if (response.success) {
                    this.departmentName = response.data.name;
                }
            }
        );
        this.subscriptions.push(sub);
    }
    loadInventoryData() {
        this.loadingIndicator = true;
        this.socketService.emit('department:inventory', {
            departmentId: this.departmentId
        });
    }
    listenToInventoryUpdates() {
        const sub = this.socketService.listen('department:inventory').subscribe(
            (response: any) => {
                if (response.success) {
                    this.inventoryData = response.data;
                    this.temp = [...response.data];
                    this.loadingIndicator = false;
                } else {
                    this.toaster.error(response.message || 'Failed to load inventory');
                }
            }
        );
        this.subscriptions.push(sub);
    }
    loadDepartments() {
        this.socketService.emit("department:all", {});
    }
    onDepartmentChange() {
        this.departmentName = this.selectedDepartment;
        this.fetchInventoryData();
    }

    fetchInventoryData(): void {
        this.loadingIndicator = true;
        this.inventoryService.getInventoryByDepartmentName(this.departmentName)
            .subscribe({
                next: (data) => {
                    this.inventoryData = data;
                    this.loadingIndicator = false;
                },
                error: (error) => {
                    this.toaster.error('Failed to fetch inventory data');
                    this.loadingIndicator = false;
                }
            });
    }
    ngOnDestroy() {
        // Clean up charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        // Remove window load event listener
        window.removeEventListener('load', () => this.initializeCharts());
        // Unsubscribe from subscriptions
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    goBack(): void {
        this.location.back();
    }
    private preparePieChartData() {
        // Create a Map to aggregate quantities by product
        const productQuantities = new Map<string, number>();

        // Process stockSpaces to aggregate product quantities
        this.stockSpaces.forEach(space => {
            const productName = space.product_name || 'Unknown Product';
            const availableQuantity = parseFloat(space.available_qty || '0');

            // Aggregate quantities for each product
            if (productQuantities.has(productName)) {
                productQuantities.set(
                    productName,
                    (productQuantities.get(productName) || 0) + availableQuantity
                );
            } else {
                productQuantities.set(productName, availableQuantity);
            }
        });

        // Prepare data for ngx-charts pie chart
        this.single = Array.from(productQuantities).map(([name, value]) => ({
            name,
            value
        }));
    }
}



export interface inventory {
    id: number;
    master_stock_id?: number | null;
    product_id?: number | null;
    product_name?: string | null;
    packed_price?: number | null;
    product_unit?: string | null;
    weight?: string | null; // Includes 'N/A'
    packing_unit?: string | null;
    packing_sort_name?: string | null;
    department_id?: number | null;
    department_table_name?: string | null;
    department_name?: string | null;
    trns_type?: string | null;
    total_price?: number | null;
    trans_remark?: string | null;
    dpt_table_ref_id?: number | null;
    distribution_center_id?: number | null;
    retail_shop_id?: number | null;
    hold_quantity?: number | null;
    quantity?: number | null;
    current_stock?: number | null;
    previous_stock?: number | null;
    mrp?: number | null;
    shop_name?: string | null;
    distribution_center_name?: string | null;
    product_st_name?: string | null;
    created_on?: Date | null;
}