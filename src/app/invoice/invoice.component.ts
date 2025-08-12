import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilityService } from '@services/utility.service';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss'
})
export class InvoiceComponent implements OnInit, OnDestroy {
  qualityData: any[] = []; dateRangeforInvoice: FormGroup; subscriptions: Subscription[] = [];
  baseImgUrl: string; defaultPic: string; VendorProfile: any; isFullPageImageVisible: boolean = false;
  fullPageImageUrl: string | null = null; approvalData: any = {}; abhishek: any; isLoading: boolean = false;
  error: string | null = null; currentDate: string; private hasReloaded: boolean = false;

  constructor(public toastr: ToastrService, public activatedRoute: ActivatedRoute, protected baseService: BaseService,
    private socketService: SocketService, private fb: FormBuilder, private router: Router,) {
    this.dateRangeforInvoice = this.fb.group({
      fromDate: [''], tillDate: ['']
    });
    // Check if this is a fresh page load or a reload
    this.hasReloaded = sessionStorage.getItem('invoicePageLoaded') === 'true';
    // Set currentDate to today's date in YYYY-MM-DD format
    this.currentDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadData();
    this.setupSocketListeners();
    if (!this.hasReloaded) {
      // Set flag in sessionStorage and reload once
      sessionStorage.setItem('invoicePageLoaded', 'true');
      window.location.reload();
    } else {
      // Normal initialization
      this.loadData();
      this.setupSocketListeners();
    }
  }

  loadData() {
    this.isLoading = true;
    this.error = null;
    const qc_id = this.activatedRoute.snapshot.paramMap.get("Vru_id");
    if (qc_id) {
      this.getVendorDataById(qc_id);
    } else {
      this.isLoading = false;
      this.error = "No Vru_id found in route parameters";
      this.toastr.error(this.error);
    }
  }

  setupSocketListeners() {
    const invoiceSubscription = this.socketService.listen('quality:get-invoice-by-date')
      .pipe(
        catchError(error => {
          this.handleError('Error fetching invoice data', error);
          return of(null);
        })
      )
      .subscribe((rowData: any) => {
        if (rowData) {
          this.qualityData = rowData.data;
          this.VendorProfile = this.qualityData[0];
          this.isLoading = false;
        }
      });
    this.subscriptions.push(invoiceSubscription);
    const vendorDataSubscription = this.socketService.listen('quality:get-vendordata-by-id')
      .pipe(
        catchError(error => {
          this.handleError('Error fetching vendor data', error);
          return of(null);
        })
      )
      .subscribe((rowData: any) => {
        if (rowData) {
          this.qualityData = rowData.data;
          this.VendorProfile = this.qualityData[0];
          this.isLoading = false;
        }
      });
    this.subscriptions.push(vendorDataSubscription);
  }

  getVendorDataById(Vru_id: string) {
    this.socketService.emit("quality:get-vendordata-by-id", { Vru_id });
  }

  handleError(message: string, error: any) {
    this.error = message;
    this.isLoading = false;
    this.toastr.error(message);
  }

  ngOnDestroy() {
    // Clean up sessionStorage on component destroy
    sessionStorage.removeItem('invoicePageLoaded');
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  printInvoice() {
    const originalFontSize = document.body.style.fontSize;
    document.body.style.fontSize = '16px';
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => {
      document.body.style.fontSize = originalFontSize;
      document.body.classList.remove('printing');
    }, 0);
  }

  calculateTotalPrice(): number {
    return this.qualityData.reduce((sum, item) => sum + item.quantity * item.priceper_unit, 0);
  }

  viewImage(imageUrl: string) {
    this.fullPageImageUrl = imageUrl;
    this.isFullPageImageVisible = true;
  }

  closeFullPageImage() {
    this.isFullPageImageVisible = false;
    this.fullPageImageUrl = null;
  }

  getSubtotal(): number {
    return this.qualityData.reduce((sum: number, item: { quantity: number; priceper_unit: number; }) => {
      return sum + item.quantity * item.priceper_unit;
    }, 0);
  }

  getGrandTotal(): number {
    const subtotal = this.getSubtotal();
    const tax = 0; // Add tax calculation if needed
    const discount = 0; // Add discount calculation if applicable
    return subtotal + tax - discount;
  }

  getInvoice() {
    if (this.dateRangeforInvoice.valid) {
      const formData = { ...this.dateRangeforInvoice.value };
      this.isLoading = true;
      this.error = null;
      this.socketService.emit('quality:get-invoice-by-date', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }

  goBack() {
    this.router.navigate(['/pages/qualitypanel']);
  }
}