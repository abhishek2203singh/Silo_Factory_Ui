import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { IsilosList } from '../../../../Models/silosList';
import Swal from 'sweetalert2';
import { InfoPanelsComponent } from './info-panels/info-panels.component';
import { NgToggleModule } from 'ng-toggle-button';
@Component({
  selector: 'app-master-silos',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, FormsModule, ReactiveFormsModule, InfoPanelsComponent, NgToggleModule],
  templateUrl: './master-silos.component.html',
  styleUrl: './master-silos.component.scss'
})
export class MasterSilosComponent implements OnInit {
  silosList: IsilosList[] = [];
  silosForm: FormGroup;
  isEditSilos: boolean = false;
  editSilosId: number = 0;
  temp: any[] = [];
  @ViewChild('openButton') openButton: ElementRef | undefined;
  @ViewChild('closeButton') closeButton: ElementRef | undefined;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  private fb = inject(FormBuilder);
  private socketService = inject(SocketService);
  private router = inject(Router);
  private toaster = inject(ToastrService);
  constructor(private datePipe: DatePipe) {
    this.silosForm = this.fb.group({
      siloName: ['', Validators.required],
      capacity: ['', Validators.required],
      // availableMilk: ['', Validators.required],
      status: ['', Validators.required],
      siloId: ['']
    })
  }



  ngOnInit(): void {

    this.getAllSilosListen();
    this.getAllSilos();
    this.editDataListen();
    this.updateSilosDataListen();
    this.submitSilosDataListen();
    this.deleteSilosListen();
  }
  getAllSilosListen() {
    this.socketService.listen('ms-silos:all').subscribe((res: any) => {
      if (res.success) {
        this.silosList = res.data;
        this.temp = [...this.silosList];
      }
      if (res.error == 402) {
        this.router.navigate(['/login']);
        this.toaster?.error(res.message)
      }
    })
  }
  getAllSilos() {
    this.socketService.emit('ms-silos:all', {});
  }

  openForm() {
    this.openButton?.nativeElement?.click()
  }
  editDataListen() {
    this.socketService.listen('ms-silos:by-id').subscribe((res: any) => {
      if (res.success) {
        let data = res.data;
        let id = data.id
        let siloName = data.silo_name;
        let totalMilk = data.total_available_milk;
        this.silosForm.patchValue({ ...data, siloName: siloName, availableMilk: totalMilk, siloId: id });
      }
      this.openForm();
    })
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  editData(siloId: number) {
    this.isEditSilos = true;
    this.editSilosId = siloId;
    this.socketService.emit("ms-silos:by-id", { siloId });
  }

  updateSilosDataListen() {
    this.socketService.listen('ms-silos:update').subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
        this.getAllSilos();
        this.closeForm();
        return
      }
      this.toaster?.error(res.message)
      if (res.error == 402) {
        this.router.navigate(['/login']);
        return
      }
    })
  }

  updateSilosData() {
    const data = this.silosForm.value;
    if (this.silosForm.valid) {
      this.socketService.emit("ms-silos:update", data);
    }
  }

  submitSilosDataListen() {
    this.socketService.listen('ms-silos:create').subscribe((res: any) => {
      if (res.success) {
        this.toaster.success(res.message);
        this.getAllSilos();
        this.closeForm();
        return
      }
      this.toaster.error(res.message);
      if (res.err == 402) {
        this.router.navigate(['/login']);
        return
      }
    })
  }

  submitSilosData() {
    const data = this.silosForm.value;
    if (this.silosForm.valid) {
      this.socketService.emit("ms-silos:create", data);
    }
  }

  deleteSilosListen() {
    this.socketService.listen("ms-silos:delete").subscribe((res: any) => {
      if (res.success) {
        Swal.fire("Delete Silos", res.message, "success");
        this.getAllSilos();
        return
      }
      Swal.fire("Delete Silos", res.message, "error");
    })
  }

  deleteSilos(siloId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: ` To delete silos , You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.socketService.emit("ms-silos:delete", { siloId });
      }
    })
  }
  closeForm() {
    this.silosForm.reset({});
    this.isEditSilos = false;
    this.editSilosId = 0;
    this.closeButton?.nativeElement?.click()
  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: IsilosList) => {
      // Convert numeric status to string (Active/Deactive) for filtering
      const statusText = item.status === 1 ? 'active' : 'deact';
      // Create separate status check
      const statusMatch = val === 'active' ? item.status === 1 :
        val === 'deactive' || val === 'deact' ? item.status === 0 :
          false;
      return (
        // Search in all relevant fields
        (item.silo_name?.toLowerCase().includes(val)) ||
        (item.capacity?.toString().toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        statusMatch || // Use the new status matching logic
        // statusText.includes(val)  ||// Check against "active" or "deactive"!val
        !val
      );
    });
    // update the rows
    this.silosList = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }
}
