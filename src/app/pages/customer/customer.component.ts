import { AfterViewChecked, AfterViewInit, Component, OnInit } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { Subscriptions } from '../../Models/subscriptions';
import { InfoPanelsComponent } from '../dashboard/info-panels/info-panels.component';
import { InfoCardsComponent } from "../dashboard/info-cards/info-cards.component";
import { VisitorsComponent } from "../dashboard/visitors/visitors.component";
import { CostComponent } from "../dashboard/cost/cost.component";
import { DiskSpaceComponent } from "../dashboard/disk-space/disk-space.component";
import { TodoComponent } from "../dashboard/todo/todo.component";
import { Chart } from 'chart.js/auto';
import { BaseService } from '@services/Base.service';

@Component({
    selector: 'app-customer',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, FormsModule, NgxPaginationModule],
    templateUrl: './customer.component.html',
    styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit, AfterViewInit {
    totalSpending: number;
    totalOrders: number;
    orderData: any[] = [];
    temp: any[] = [];
    total_price: string = '0.00';
    quantity: any;
    subscriptions: any[] = [];

    constructor(private router: Router, protected baseService: BaseService, private socketService: SocketService,
        private toaster: ToastrService,) { }

    ngOnInit(): void {
        this.calculateSummary();
        this.getAllDataListen();
        this.getAllData();

        const subscriber = this.socketService.listen("subscription:by-customer").subscribe((res: any) => {
            if (res.success) {
                this.subscriptions = res.data;
                //console.log("subscription data =>", this.subscriptions);
                this.initializeSubscriptionChart();
            } else {
                this.toaster.error(res.message);
                if (res.error == 402) {
                    this.socketService.Logout();
                }
            }
        });

        this.socketService.emit("subscription:by-customer", {});
    }

    getAllDataListen() {
        this.socketService.listen("customer-order:all").subscribe((res: any) => {
            if (res.success) {
                this.orderData = res.data;
                this.temp = [...this.orderData];
                this.calculateTotalPrice();
                this.calculateTotalQuantity();
                this.calculateTotalOrders();
                this.initializePieChart();
            } else {
                this.toaster.error(res.message);
            }
        });
    }


    getAllData() {
        this.socketService.emit("customer-order:all", {});
    }

    private calculateTotalPrice(): void {
        const totalPrice = this.orderData.reduce((sum, order) => {
            // Ensure total_price is parsed as a number (convert from string)
            const orderTotalPrice = parseFloat(order.total_price || '0');
            return sum + orderTotalPrice;
        }, 0);
        this.total_price = totalPrice.toFixed(2);
    }

    private calculateTotalQuantity(): void {
        const totalQuantity = this.orderData.reduce((sum, order) => {
            const orderQuantity = parseFloat(order.quantity || '0');
            return sum + orderQuantity;
        }, 0);
        this.quantity = totalQuantity;
    }

    private calculateTotalOrders(): void {
        this.totalOrders = this.orderData.length;
    }

    ngAfterViewInit(): void {
        this.initializePieChart();
        // this.initializeBarChart();
    }

    calculateSummary(): void {
        this.totalSpending = this.orderData.reduce((sum: number, order: any) => sum + (parseFloat(order.total_price) || 0), 0);
        this.totalOrders = this.orderData.length;
    }

    initializePieChart(): void {
        if (this.orderData.length === 0) return;

        const productQuantities: { [key: string]: number } = {};
        this.orderData.forEach(order => {
            const productName = order.product_name;
            const quantity = parseFloat(order.quantity) || 0;
            if (productQuantities[productName]) {
                productQuantities[productName] += quantity;
            } else {
                productQuantities[productName] = quantity;
            }
        });

        // Extract product names and their total quantities
        const productNames = Object.keys(productQuantities);
        const quantities = Object.values(productQuantities);


        const backgroundColor = ['#4B6B89', '#5D8A7A', '#8D6A8C', '#E07A5F', '#881f7c', '#44842c', '#FF5733', '#33FF57', '#3357FF', '#e0ac1b', '#f48b8c'];
        const hoverBackgroundColor = ['#3A516D', '#4A6F64', '#744F72', '#C96550', '#6e3167', '#3b672a', '#D9462B', '#2BD946', '#2B46D9', '#f5b70c', '#F6A2A3'];

        // Create or update the pie chart
        const chartContainer = document.getElementById('pieChart') as HTMLCanvasElement;
        if (chartContainer) {
            new Chart(chartContainer, {
                type: 'pie',
                data: {
                    labels: productNames,
                    datasets: [
                        {
                            data: quantities,
                            backgroundColor: backgroundColor.slice(0, productNames.length),
                            hoverBackgroundColor: hoverBackgroundColor.slice(0, productNames.length),
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.label}: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.error('Pie chart container not found.');
        }
    }


    // initializeBarChart(): void {
    //     const productNames = this.orders.map(order => order.product);
    //     const quantities = this.orders.map(order => order.quantity);
    //     new Chart('barChart', {
    //         type: 'bar',
    //         data: {
    //             labels: productNames,
    //             datasets: [
    //                 {
    //                     label: 'Product Quantities',
    //                     data: quantities,
    //                     backgroundColor: ['#4B6B89', '#5D8A7A', '#B29535', '#8D6A8C']
    //                 }
    //             ]
    //         },
    //         options: {
    //             responsive: true,
    //             scales: {
    //                 y: {
    //                     beginAtZero: true
    //                 }
    //             }
    //         }
    //     });
    // }

    initializeSubscriptionChart(): void {
        const days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // Initialize arrays for morning and evening orders with explicit types
        const morningOrders: number[] = [];
        const eveningOrders: number[] = [];

        // Iterate over the days and populate the order counts
        days.forEach(day => {
            const morningCount = this.subscriptions.filter(sub => sub[day.toLowerCase()] && sub.shift_name === 'Morning').length;
            const eveningCount = this.subscriptions.filter(sub => sub[day.toLowerCase()] && sub.shift_name === 'Evening').length;

            morningOrders.push(morningCount);
            eveningOrders.push(eveningCount);
        });

        // Initialize the chart
        new Chart('subscriptionChart', {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Morning Orders',
                        data: morningOrders,
                        backgroundColor: '#4caf50',
                        hoverBackgroundColor: '#388e3c'
                    },
                    {
                        label: 'Evening Orders',
                        data: eveningOrders,
                        backgroundColor: '#2196f3',
                        hoverBackgroundColor: '#1976d2'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Orders'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Days of the Week'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }


}
