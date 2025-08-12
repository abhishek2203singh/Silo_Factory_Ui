import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { InfoCardsComponent } from '../dashboard/info-cards/info-cards.component';
import { VisitorsComponent } from '../dashboard/visitors/visitors.component';
import { InfoCustomCardComponent } from './Admin-Dashboard_cards/info-custom-card/info-custom-card.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SocketService } from '@services/Socket.service';
import { Chart } from 'chart.js/auto';
import { single } from '@data/charts.data';
@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [
        InfoCustomCardComponent,
        NgxChartsModule
    ],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
    private socketService = inject(SocketService);
    private charts: { [key: string]: Chart } = {};
    barChartDataPending: any[] = [];
    barChartDataApproved: any[] = [];
    barChartDataRejected: any[] = [];
    barChartDataProcess: any[] = [];
    approvalSpaces: any[] = [];
    rows: any[] = [];
    public barChartData: any[] = [];
    public showLegend = true;
    public single: { name: string; value: number }[] = [];
    public chartData: any[] = [];
    public stockSpaces: any[] = [];
    public gradient = true;
    public showLabels = true;
    public explodeSlices = false;
    public doughnut = false;
    approved: [] = [];
    rejected: [] = [];
    chart: Chart | null = null;
    public colorScheme: any = {
        domain: ['#2F3E9E', '#D22E2E', '#378D3B', '#0096A6', '#F47B00', '#606060']
    };
    public orders: { product: string; quantity: number }[] = [];
    public order1: { status: string; quantity: number }[] = [];
    data: any;
    public onSelect(event: any): void {
    }
    ngOnInit(): void {
        this.getAllSilosAtChart();
        this.getAllSilosAtChartListen();
        this.getAllapproval();
        this.getAllApprovalListen();
    }
    ngAfterViewInit(): void {
        this.initializeBarChart();
    }
    getAllSilosAtChart(): void {
        this.socketService.emit('ms-silos:all', {});
    }
    getAllSilosAtChartListen(): void {
        this.socketService.listen('ms-silos:all').subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.chartData = res.data;
                    this.stockSpaces = res.data;
                    this.processInventoryData();
                }
            },
            error: (err) => {
                console.error('Error fetching silos data', err);
            }
        });
    }
    private processInventoryData(): void {
        const productQuantities = new Map<string, number>();
        this.stockSpaces.forEach(space => {
            const productName = space.silo_name || 'Unknown Product';
            const availableQuantity = parseFloat(space.capacity || '0');
            productQuantities.set(
                productName,
                (productQuantities.get(productName) || 0) + availableQuantity
            );
        });
        this.single = Array.from(productQuantities).map(([name, value]) => ({
            name,
            value
        }));
    }
    private processInventoryData1(): void {
        const approvalStatus = new Map<string, number>();
        this.approvalSpaces.forEach(space => {
            const status = space.approval_status || 'Unknown';
            const quantity = parseFloat(space.quantity || '0');
            approvalStatus.set(status, (approvalStatus.get(status) || 0) + quantity);
        });
        this.chartData = Array.from(approvalStatus).map(([name, value]) => ({
            name,
            value
        }));
    }
    initializeBarChart() {
        const ctx = document.getElementById('barChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Pending', 'Approved', 'Rejected', 'Under Process'],
                datasets: [{
                    label: 'Number of Requests',
                    data: [0, 0, 0], // Initial data
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Approval Status Distribution'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    updateBarChart() {
        if (this.chart) {
            const labels = ['Pending', 'Approved', 'Rejected', 'Under Process'];
            const data = [
                this.barChartDataPending.length,
                this.barChartDataApproved.length,
                this.barChartDataRejected.length,
                this.barChartDataProcess.length
            ];
            this.chart.data.labels = labels;
            this.chart.data.datasets = [{
                label: 'Number of Requests', // Changed from 'Approval Status'
                data: data,
                backgroundColor: [
                    'rgba(255, 206, 86, 0.6)',  // Yellow for Pending
                    'rgba(75, 192, 192, 0.6)',   // Green for Approved
                    'rgba(255, 99, 132, 0.6)',   // Red for Rejected
                    'rgba(0, 123, 255, 0.6)'   // Blue for Under Process
                ],
                borderColor: [
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(0, 123, 255, 1)'
                ],
                borderWidth: 1
            }];
            this.chart.options = {
                responsive: true,
                plugins: {
                    legend: {
                        display: false  // Hide the legend since we have clear labels
                    },
                    title: {
                        display: true,
                        text: 'Approval Status Distribution',
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Requests'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Status'
                        }
                    }
                }
            };
            this.chart.update();
        }
    }
    getAllapproval() {
        this.socketService.emit("approval:all", {});
    }
    getAllApprovalListen() {
        this.socketService.listen('approval:all').subscribe({
            next: (res: any) => {
                if (res.success) {
                    const groupedApprovalData = res.data.reduce((acc: any, item: any) => {
                        const status = item.approval_status;
                        if (!acc[status]) {
                            acc[status] = [];
                        }
                        acc[status].push(item);
                        return acc;
                    }, {});
                    if (groupedApprovalData['Pending']) {
                        this.barChartDataPending = groupedApprovalData['Pending'];
                    }
                    if (groupedApprovalData['Approved']) {
                        this.barChartDataApproved = groupedApprovalData['Approved'];
                    }
                    if (groupedApprovalData['Rejected']) {
                        this.barChartDataRejected = groupedApprovalData['Rejected'];
                    }
                    if (groupedApprovalData['Under Process']) {
                        this.barChartDataProcess = groupedApprovalData['Under Process'];
                    }
                    this.updateBarChart();
                }
            },
            error: (err) => {
                console.error('Error fetching approval data', err);
            }
        });
    }
}

