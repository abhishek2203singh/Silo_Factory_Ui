import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PrintService } from '@services/print.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, RouterModule, CommonModule, FormsModule],
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})
export class OrderComponent implements OnInit {
  orderData: any[] = [];
  temp: any[] = [];
  @ViewChild(DatatableComponent) table: DatatableComponent;

  ngOnInit(): void {
    this.getAllData();
    this.getAllDataListen();
    this.listenToStatusChangeResponse();
  }
  constructor(
    private toaster: ToastrService,
    private route: ActivatedRoute,  // ActivatedRoute for retrieving route parameters
    private socketService: SocketService,
    private baseService: BaseService,
    private datePipe: DatePipe,
    private printService: PrintService,
    private router: Router,) { }


  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    // Filter the data based on the search input
    const filteredData = this.temp.filter((item: any) => {
      // Create separate status check
      const statusMatch = val === 'active' ? item.status === 1 :
        val === 'cancelled' || val === 'cancel' ? item.status === 0 :
          false;
      return (
        (this.datePipe.transform(item.order_date, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        (item.cust_name?.toString().toLowerCase().includes(val)) ||
        (item.product_name?.toString().toLowerCase().includes(val)) ||
        (item.quantity?.toLowerCase().includes(val)) ||
        (item.price?.toString().includes(val)) ||
        (item.total_price?.toString().includes(val)) ||
        (item.delivery_boy_name?.toString().toLowerCase().includes(val)) ||
        (item.delivery_status_name?.toString().toLowerCase().includes(val)) ||
        statusMatch || // Check against "active" or "cancelled"
        !val
      );
    });

    // Update the displayed rows
    this.orderData = filteredData;

    // Reset to the first page when the filter changes
    this.table.offset = 0;
  }
  getAllDataListen() {
    this.socketService.listen("customer-order:all").subscribe((res: any) => {
      if (res.success) {
        this.orderData = res.data
        console.log("orderData", this.orderData)
        this.temp = [...this.orderData]
      } else {
        this.toaster.error(res.message)
      }
    })
  }

  getAllData() {
    this.socketService.emit("customer-order:all", {})
  }
  // Predefined delivery statuses
  deliveryStatuses = [
    { id: 1, name: 'Scheduling' },
    { id: 2, name: 'Order' },
    { id: 3, name: 'Processing' },
    { id: 4, name: 'Delivered' },
    { id: 5, name: 'Return' },
    { id: 6, name: 'Cancel' },
    { id: 7, name: 'Out of Delivery' }
  ];

  // Start editing status for a specific row
  startStatusEdit(orderId: number) {
    const row = this.orderData.find(order => order.order_id === orderId);

    if (row) {
      // Reset editing for other rows
      this.orderData.forEach(order => order.isEditing = false);

      // Set current row in editing mode
      row.isEditing = true;
      row.tempDeliveryStatus = row.delivery_status; // Temporary backup
    }
  }

  // Cancel status editing
  cancelStatusEdit(row: any) {
    row.isEditing = false;
    row.delivery_status = row.tempDeliveryStatus; // Reset changes
  }

  // Save status change

  saveStatusChange(orderId: number) {
    const row = this.orderData.find(order => order.order_id === orderId);

    if (row) {
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change the delivery status?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, save it!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Emit the socket event to change the delivery status
          this.socketService.emit('customer-order:change-delivery-status', {
            id: orderId,
            status: row.delivery_status,
            note: ''
          });

          Swal.fire(
            'Updated!',
            'The delivery status has been updated successfully.',
            'success'
          );

          row.isEditing = false; // Exit editing mode
        } else {
          Swal.fire(
            'Cancelled',
            'The delivery status change was cancelled.',
            'info'
          );
        }
      });
    }
  }

  // Listen for status change response
  listenToStatusChangeResponse() {
    this.socketService.listen('customer-order:change-delivery-status').subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
        this.getAllData(); // Refresh data
      } else {
        this.toaster.error(res.message);
      }
    });
  }

  // Helper to get delivery status name
  getStatusName(statusId: number): string {
    const status = this.deliveryStatuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  }

  printFile() {
    const headers = ['Sr. No', 'Date', 'Customer', 'Product', 'Quantity', 'Price', 'Total', 'Delivery Boy', 'Delivery Status'
    ];

    this.printService.print(headers, this.orderData, (row, index) => [
      (index + 1).toString(),
      this.datePipe.transform(row.order_date, 'MMM d, y') || 'N/A',
      row.cust_name || '',
      row.product_name || '',
      row.quantity || '',
      `₹${row.price || 0}`,
      `₹${row.total_price || 0}`,
      row.delivery_boy_name || '',
      this.getStatusName(row.delivery_status) || 'Unknown',
    ]);
  }
  exportToCSV() {
    const csvData = [];
    const headers = ['Sr. No', 'Date', 'Customer', 'Product', 'Quantity', 'Price', 'Total', 'Delivery Boy', 'Delivery Status'];
    csvData.push(headers.join(','));

    this.orderData.forEach((row, index) => {
      const rowData = [
        index + 1,  // Sr. No
        this.datePipe.transform(row.order_date, 'MMM d, y') || 'N/A',
        row.cust_name || '',
        row.product_name || '',
        row.quantity || '',
        `₹${row.price || 0}`,
        `₹${row.total_price || 0}`,
        row.delivery_boy_name,
        row.status === 0
          ? 'Cancelled'
          : row.delivery_status_name || 'N/A'
      ];
      csvData.push(rowData.map(item => `"${item}"`).join(','));
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
