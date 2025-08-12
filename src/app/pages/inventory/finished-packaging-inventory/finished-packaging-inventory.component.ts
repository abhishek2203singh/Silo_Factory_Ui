import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { CurrencyPipe } from '@angular/common';
@Component({
  selector: 'app-finished-packaging-inventory',
  standalone: true,
  imports: [],
  templateUrl: './finished-packaging-inventory.component.html',
  styleUrl: './finished-packaging-inventory.component.scss',
  providers: [CurrencyPipe]
})
export class FinishedPackagingInventoryComponent implements OnInit {
  currentInventoryValue: number = 1653140;

  constructor(private currencyPipe: CurrencyPipe) { }

  ngOnInit() {
    this.createValueProjectionChart();
    this.createTotalValueByItemChart();
    this.createAverageSalesChart();
  }

  formatCurrency(value: number): string {
    return this.currencyPipe.transform(value, 'USD', 'symbol', '1.0-0') || '';
  }

  createValueProjectionChart() {
    const ctx = document.getElementById('valueProjectionChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Nov \'23', '15 Nov', 'Dec \'23', '15 Dec', 'Jan \'24', '15 Jan', 'Feb \'24', '15 Feb', 'Mar \'24', '15 Mar'],
        datasets: [{
          label: 'Total projected value',
          data: [1650000, 1640000, 1630000, 1620000, 1610000, 1600000, 1590000, 1580000, 1570000, 1560000],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value: number) => this.formatCurrency(value as number)
            }
          }
        }
      } as ChartConfiguration['options']
    });
  }

  createTotalValueByItemChart() {
    const ctx = document.getElementById('totalValueByItemChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Bulldozer', 'Compactor', 'Crawler', 'Excavator', 'Grader', 'Mixer', 'Raker', 'Scraper', 'Skid Steer', 'Tipper'],
        datasets: [{
          data: [15, 10, 5, 12, 8, 20, 7, 5, 13, 5],
          backgroundColor: [
            'rgb(54, 162, 235)', 'rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(255, 159, 64)',
            'rgb(153, 102, 255)', 'rgb(255, 205, 86)', 'rgb(201, 203, 207)', 'rgb(255, 99, 71)',
            'rgb(50, 205, 50)', 'rgb(138, 43, 226)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((acc, data) => acc + data, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${percentage}%`;
              }
            }
          }
        }
      } as ChartConfiguration['options']
    });
  }

  createAverageSalesChart() {
    const ctx = document.getElementById('averageSalesChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Bulldozer', 'Crawler', 'Compactor', 'Grader', 'Scraper', 'Skid Steer', 'Raker', 'Mixer', 'Tipper', 'Excavator'],
        datasets: [{
          label: 'Average sales per month',
          data: [3, 6, 6, 5, 6, 4, 6, 4, 5, 5],
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Average Sales'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      } as ChartConfiguration['options']
    });
  }
}

