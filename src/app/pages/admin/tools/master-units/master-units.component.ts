import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DatePipe, CommonModule } from '@angular/common';



@Component({
  selector: 'app-master-units',
  standalone: true,
  imports: [NgxDatatableModule, ReactiveFormsModule, CommonModule],
  templateUrl: './master-units.component.html',
  styleUrl: './master-units.component.scss'
})
export class MasterUnitsComponent implements OnInit {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  unitForm: FormGroup;
  unitId: number = 0;
  isEditMode: boolean = false;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType

  constructor(private socketService: SocketService, private fb: FormBuilder, public toastr: ToastrService, private datePipe: DatePipe) {
    this.unitForm = this.fb.group({
      unitName: ['', Validators.required],
      shortName: ['', Validators.required],

    });
  }
  ngOnInit(): void {
    this.getAllunits();
    this.getUnits();
    this.editunitListen();

    const sub5 = this.socketService.listen('ms-unit:create').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.unitForm.reset({
          unitName: '',
          shortName: '',

        });
        this.getUnits();
      } else {
        this.toastr.error(response.message);
      }
    });
    this.socketService.listen("ms-unit:update").subscribe((res: any) => {
      if (res.success) {
        this.toastr.success(res.message);
        this.unitForm.reset();
        this.getUnits();
      } else {
        this.toastr.error(res.message);
      }
    })
  }
  editunitListen() {
    this.socketService.listen("ms-unit:by-id").subscribe((res: any) => {
      const data = res.data;

      if (data) {
        const id = data.unitId;

        // Patch the received data to the form
        this.unitForm.patchValue({
          ...data,
          unitName: data.name,
          shortName: data.st_name,
          unitId: id,
        });

        // Scroll to the top of the page smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error('No data received for unit by ID');
      }
    });

    this.getUnits();
  }

  unit: any[] = [];
  getAllunits() {
    this.socketService.listen('ms-unit:all').subscribe((res: any) => {
      if (res?.success) {
        this.unit = res.data;
        this.temp = [...this.unit];
      }
      // ("units",this.unit)
    })
  }
  getUnits() {
    this.socketService.emit('ms-unit:all', {});
  }
  onSubmit() {
    if (this.unitForm.valid) {
      const formData = { ...this.unitForm.value, }
      this.socketService.emit('ms-unit:create', formData);
    } else {
      this.toastr.warning('Please fill all required fields.');
    }

  }
  editUnit(unitId: number): void {
    this.isEditMode = true;
    this.unitId = unitId;
    this.socketService.emit('ms-unit:by-id', { unitId });

  }
  updateUnit() {
    if (this.unitForm.valid) {
      const data = { ...this.unitForm.value, id: this.unitId };
      this.socketService.emit("ms-unit:update", { ...data, unitId: data.id });
    }
  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {

      return (
        // Search in all relevant fields
        (item.name?.toLowerCase().includes(val)) ||
        (item.st_name?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        !val
      );
    });

    // update the rows
    this.unit = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }
}
