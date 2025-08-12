import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SocketService } from '@services/Socket.service';
import { Chart } from 'chart.js/auto';
import { FormsModule } from '@angular/forms';
@Component({
    selector: 'app-inventory-department',
    standalone: true,
    imports: [NgxChartsModule, FormsModule],
    templateUrl: './inventory-department.component.html',
    styleUrl: './inventory-department.component.scss'
})
export class InventoryDepartmentComponent implements OnInit, AfterViewInit {
    private socketService = inject(SocketService);
    private charts: { [key: string]: Chart } = {};
    chart: Chart | null = null;

    fromDate: string = '';
    tillDate: string = '';

    public single: { name: string; value: number }[] = [];
    public barChartDataPending: any[] = [];
    public barChartDataApproved: any[] = [];
    public barChartDataRejected: any[] = [];
    public barChartDataProcess: any[] = [];
    public showLegend = true;
    public gradient = true;
    public showLabels = true;
    public explodeSlices = false;
    public doughnut = false;

    public colorScheme: any = {
        domain: ['#2F3E9E', '#D22E2E', '#378D3B', '#0096A6', '#F47B00', '#606060']
    };
    ngOnInit(): void {
        this.fetchFilteredData(); // no date => all data
    }
    // ngOnInit(): void {
    //     const today = new Date().toISOString().split('T')[0];
    //     this.fromDate = today;
    //     this.tillDate = today;

    //     this.listenToInventoryData();
    //     this.listenToApprovalData();
    //     this.fetchFilteredData();  // Send request after setting up listeners
    // }


    ngAfterViewInit(): void {
        this.initializeBarChart();
    }
    listenToApprovalData(): void {
        this.socketService.listen('approval:all').subscribe({
            next: (res: any) => {
                if (res.success) {
                    const grouped = res.data.reduce((acc: any, item: any) => {
                        const status = item.approval_status;
                        if (!acc[status]) acc[status] = [];
                        acc[status].push(item);
                        return acc;
                    }, {});

                    this.barChartDataPending = grouped['Pending'] || [];
                    this.barChartDataApproved = grouped['Approved'] || [];
                    this.barChartDataRejected = grouped['Rejected'] || [];
                    this.barChartDataProcess = grouped['Under Process'] || [];

                    this.updateBarChart();
                } else {
                    this.barChartDataPending = [];
                    this.barChartDataApproved = [];
                    this.barChartDataRejected = [];
                    this.barChartDataProcess = [];
                    this.updateBarChart();
                }
            },
            error: (err) => {
                console.error('Error fetching approval data', err);
            }
        });
    }

    listenToInventoryData(): void {
        this.socketService.listen('inventory:all').subscribe({
            next: (res: any) => {
                // console.log("Inventory Response:", res);
                if (res.success) {
                    this.transformDataForPieChart(res.data);
                } else {
                    this.single = []; // clear chart if no success
                }
            },
            error: (err) => {
                console.error('Error fetching inventory data', err);
            }
        });
    }


    fetchFilteredData(): void {
        // Clear previous data
        this.single = [];
        this.barChartDataPending = [];
        this.barChartDataApproved = [];
        this.barChartDataRejected = [];
        this.barChartDataProcess = [];
        this.updateBarChart();

        let payload: any = {};

        if (this.tillDate) {
            payload.tillDate = this.tillDate;
        }

        if (this.fromDate) {
            payload.fromDate = this.fromDate;
        }

        // ✅ Jab koi date nahi hogi, payload will be empty — means fetch all data
        this.socketService.emit('inventory:all', payload);
        this.socketService.emit('approval:all', payload);

        this.listenToInventoryData();
        this.listenToApprovalData();
    }



    getAllSilosAtChartListen(): void {
        this.socketService.listen('inventory:all').subscribe({
            next: (res: any) => {
                // console.log("Inventory Response:", res);
                if (res.success) {
                    this.transformDataForPieChart(res.data);
                }
            },
            error: (err) => {
                console.error('Error fetching inventory data', err);
            }
        });
    }

    getAllApprovalListen(): void {
        this.socketService.listen('approval:all').subscribe({
            next: (res: any) => {
                if (res.success) {
                    const grouped = res.data.reduce((acc: any, item: any) => {
                        const status = item.approval_status;
                        if (!acc[status]) acc[status] = [];
                        acc[status].push(item);
                        return acc;
                    }, {});

                    this.barChartDataPending = grouped['Pending'] || [];
                    this.barChartDataRejected = grouped['Rejected'] || [];
                    this.barChartDataProcess = grouped['Under Process'] || [];

                    this.updateBarChart();
                }
            },
            error: (err) => {
                console.error('Error fetching approval data', err);
            }
        });
    }

    private transformDataForPieChart(data: any): void {
        const chartData: { name: string; value: number }[] = [
            { name: 'Pasteur. Incoming', value: data.totalPasteurizationIncommingMilk ?? 0 },
            { name: 'Pasteur. Outgoing', value: data.totalPasteurizationOutgoingMilk ?? 0 },
            { name: 'Pasteur. Requested', value: data.totalPasteurizationRequestedMilk ?? 0 },
            { name: 'Silo Incoming', value: data.totalSiloIncommingMilk ?? 0 },
            { name: 'Silo Outgoing', value: data.totalSiloOutgoingMilk ?? 0 },
            { name: 'Vendor Raw Milk', value: data.vendorRawMilk ?? 0 }
        ];

        this.single = chartData;
        console.log('Pie chart data:', this.single);
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
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(0, 123, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(0, 123, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Approval Status Distribution'
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
            }
        });
    }

    updateBarChart() {
        if (this.chart) {
            this.chart.data.datasets[0].data = [
                this.barChartDataPending.length,
                this.barChartDataApproved.length,
                this.barChartDataRejected.length,
                this.barChartDataProcess.length
            ];
            this.chart.update();
        }
    }

    public onSelect(event: any): void {
        console.log('Chart selection:', event);
    }
}
