import { Component, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';


@Component({
  selector: 'app-invoice-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-slider.component.html',
  styleUrls: ['./invoice-slider.component.scss'],
  animations: [
    trigger('slideAnimation', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class InvoiceSliderComponent {
  @Input() selectedCustomers: any[] = [];
  currentInvoiceIndex = 0;
  today = new Date();
  dueDate = new Date(this.today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from today
  constructor(private date: DatePipe) {

  }

  // In your component
  calculateTotalAmount1(invoiceData: any[]): number {
    // Check if invoiceData is valid and is an array
    if (!Array.isArray(invoiceData) || invoiceData.length === 0) {
      return 0;
    }

    // Safely calculate total using reduce with type checking
    return invoiceData.reduce((total, item) => {
      // Ensure amount_user is a valid number
      const itemAmount = parseFloat(item.amount_user);
      return total + (isNaN(itemAmount) ? 0 : itemAmount);
    }, 0);
  }
  nextInvoice() {
    if (this.currentInvoiceIndex < this.selectedCustomers.length - 1) {
      this.currentInvoiceIndex++;
    }
  }

  prevInvoice() {
    if (this.currentInvoiceIndex > 0) {
      this.currentInvoiceIndex--;
    }
  }
  calculateTotalAmount(invoicedata: any[]): number {
    return invoicedata.reduce((total, item) => total + item.amount_user, 0);
  }

  calculateTax(invoicedata: any[]): number {
    const total = this.calculateTotalAmount(invoicedata);
    return total * 0.1; // 10% tax
  }

  calculateGrandTotal(invoicedata: any[]): number {
    const total = this.calculateTotalAmount(invoicedata);
    const tax = this.calculateTax(invoicedata);
    return total + tax;
  }

  printInvoice() {
    try {
      // Find the invoice print element
      const invoicePrintElement = document.querySelector('#invoiceprint');

      // Check if the element exists
      if (!invoicePrintElement) {
        console.error('Invoice print element not found');
        alert('Unable to find invoice details for printing');
        return;
      }

      // Create a deep clone of the invoice content
      const printContents = invoicePrintElement.cloneNode(true) as HTMLElement;

      // Construct the print document with error handling for innerHTML
      const printDocumentContent = printContents ? printContents.outerHTML : '<p>No invoice content available</p>';

      // Create print document with custom styling to match the modern-invoice-body layout
      const printDocument = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pious Dairy Farm - Invoice</title>
          <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" />
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .modern-invoice-body {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              
            }
            .modern-invoice-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
            }
            .company-name {
              font-size: 1.5em;
              font-weight: bold;
              color: #333;
            }
            .modern-invoice-title {
              text-align: center;
              margin-bottom: 20px;
            }
            .modern-invoice-title h2 {
              margin: 0;
              text-transform: uppercase;
              color: #333;
            }
            .modern-invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .customer-info, .invoice-meta {
              width: 30%;
               margin-top: 20px;
               line-height: 1;
            }
            .customer-info h3 {
              margin-bottom: 10px;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            table th, table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
            }
            table thead {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            table tfoot {
              font-weight: bold;
            }
            .modern-invoice-footer {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              border-top: 2px solid #f0f0f0;
              padding-top: 20px;
            }
            .payment-details {
              width: 60%;
            }
            .authorized-signature {
              width: 30%;
              text-align: right;
            }
            .signature-placeholder {
              border-top: 1px solid #333;
              width: 200px;
              margin-left: auto;
              margin-top: 10px;
            }
            @media print {
              body {
                zoom: 0.9;
              }
              .card-footer {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="modern-invoice-body">
            ${printDocumentContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;

      // Create print window with error handling
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      if (!printWindow) {
        console.error('Popup blocker might have prevented opening print window');
        alert('Please disable popup blocker to print invoice');
        return;
      }

      // Write document with additional error handling
      try {
        printWindow.document.write(printDocument);
        printWindow.document.close();
      } catch (writeError) {
        console.error('Error writing print document:', writeError);
        printWindow.close();
        alert('An error occurred while preparing the invoice for print');
      }
    } catch (error) {
      console.error('Print invoice error:', error);
      alert('Unable to print invoice. Please try again.');
    }
  }
}