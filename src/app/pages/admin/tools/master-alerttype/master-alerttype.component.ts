import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';

import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { DatatableComponent, id, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
@Component({
  selector: 'app-master-alerttype',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
  templateUrl: './master-alerttype.component.html',
  styleUrl: './master-alerttype.component.scss'
})
export class MasterAlerttypeComponent implements OnInit, OnDestroy {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  editForm: FormGroup;
  alertType: any[] = [];
  private subscriptions: Subscription[] = [];

  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  isEditMode: boolean = false;
  alertId: number = 0;

  constructor(
    private socketService: SocketService,
    public toastr: ToastrService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Initialize socket event listeners
    this.initializeSocketListeners();

    // Fetch initial data
    this.getalertType();
  }

  private initializeSocketListeners(): void {
    // Listen for all alert types
    const alertTypeSub = this.socketService.listen('alert-type:all')
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.alertType = res.data;
            this.temp = [...this.alertType];
          } else {
            this.toastr.error('Failed to fetch alert types');
          }
        },
        error: (error) => {
          this.toastr.error('Error fetching alert types');
          console.error('Alert type fetch error:', error);
        }
      });
    this.subscriptions.push(alertTypeSub);

    // Listen for create events
    const createSub = this.socketService.listen('ms-alert-type:create')
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success(response.message);
            this.resetForm();
            this.getalertType(); // Refresh the list
          } else {
            this.toastr.error(response.message);
          }
        },
        error: (error) => {
          this.toastr.error('Error creating alert type');
          console.error('Create error:', error);
        }
      });
    this.subscriptions.push(createSub);

    // Listen for update events
    const updateSub = this.socketService.listen('ms-alert-type:update')
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success(res.message);
            this.resetForm();
            this.getalertType(); // Refresh the list
          } else {
            this.toastr.error(res.message);
          }
        },
        error: (error) => {
          this.toastr.error('Error updating alert type');
          console.error('Update error:', error);
        }
      });
    this.subscriptions.push(updateSub);

    // Listen for fetch by ID events
    const byIdSub = this.socketService.listen('ms-alert-type:by-id').subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.editForm.patchValue({
            name: String(res.data.name),
          });

          // Scroll to the top after successfully fetching and patching data
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.toastr.error('Failed to fetch alert type details');
        }
      },
      error: (error) => {
        this.toastr.error('Error fetching alert type details');
        console.error('Fetch by ID error:', error);
      },
    });

    // Add the subscription to the subscriptions array to manage it properly
    this.subscriptions.push(byIdSub);

  }

  getalertType(): void {
    this.socketService.emit('alert-type:all', {});
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const formData = { ...this.editForm.value };
      this.socketService.emit('ms-alert-type:create', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }

  updateDetails(): void {
    if (this.editForm.valid) {
      const data = {
        ...this.editForm.value,
        id: this.alertId,
        alertTypeId: this.alertId
      };
      this.socketService.emit('ms-alert-type:update', data);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }
  }

  editName(alertTypeId: number): void {
    this.isEditMode = true;
    this.alertId = alertTypeId;
    this.socketService.emit('ms-alert-type:by-id', { alertTypeId });
  }

  private resetForm(): void {
    this.editForm.reset({ name: '' });
    this.isEditMode = false;
    this.alertId = 0;
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {
      // Convert numeric status to string (Active/Deactive) for filtering
      const statusText = item.status === 1 ? 'active' : 'deactive';
      return (
        // Search in all relevant fields
        (item.name?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        statusText.includes(val) || // Check against "active" or "deactive"
        !val
      );
    });

    // update the rows
    this.alertType = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

}