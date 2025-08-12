import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ActivatedRoute } from '@angular/router';
import { InventoryService } from '@services/inventory.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    NgxDatatableModule, CommonModule
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit, AfterViewInit {
  public departmentName: string;
  public inventoryData: any;
  @ViewChild(DatatableComponent) table: DatatableComponent;

  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService
  ) { }

  purchaseDetails = [
    { vendor: 'Vendor 1', category: '7TH ENG MED', product: 'Product 1', quantity: 3, purchaseRate: 44, salesRate: 46 },
    { vendor: 'Vendor 2', category: '1ST ENG MED', product: 'Product 2', quantity: 9, purchaseRate: 44, salesRate: 46 },
    { vendor: 'Vendor 3', category: '1ST ENG MED', product: 'Product 3', quantity: 8, purchaseRate: 44, salesRate: 46 },
    { vendor: 'Vendor 4', category: '1ST ENG MED', product: 'Product 4', quantity: 1, purchaseRate: 29, salesRate: 31 },
    { vendor: 'Vendor 5', category: '2ND ENG MED', product: 'Product 5', quantity: 3, purchaseRate: 31, salesRate: 33 }
  ];

  totalVendors = 66;
  totalCategories = 47;
  totalProducts = 225;
  totalSales = 232;

  ngOnInit() {
    // Get department name from route parameters
    this.departmentName = this.route.snapshot.paramMap.get('departmentName')!;
    this.fetchInventoryData();
  }

  ngAfterViewInit(): void {
    // Initialize charts after the view has been rendered
    this.createSalesReportChart();
    this.createProductDetailsChart();
    this.createCategoryWiseSalesChart();
    this.createCategoryWiseQuotationChart();
  }

  fetchInventoryData(): void {
    this.inventoryService.getInventoryByDepartmentName(this.departmentName)
      .subscribe(data => {
        this.inventoryData = data;
      });
  }

  createSalesReportChart() {
    const ctx = document.getElementById('salesReportChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'],
        datasets: [
          {
            label: 'Remaining Quantity',
            data: [50, 30, 20, 900, 750, 400, 100, 10, 500, 200],
            backgroundColor: '#17a2b8'
          },
          {
            label: 'Sold Quantity',
            data: [100, 50, 30, 20, 40, 60, 10, 5, 30, 40],
            backgroundColor: '#5eb572'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true },
          y: { stacked: true }
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
}
