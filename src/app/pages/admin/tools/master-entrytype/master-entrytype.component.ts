import { Component, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '../../../../services/Socket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { NgToggleModule } from 'ng-toggle-button';
@Component({
  selector: 'app-master-entrytype',
  standalone: true,
  imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, NgToggleModule],
  templateUrl: './master-entrytype.component.html',
  styleUrl: './master-entrytype.component.scss'
})
export class MasterEntrytypeComponent {
  editing: any = {};
  rows: any[] = [];
  temp: any[] = [];
  selected: any[] = [];
  reorderable: boolean = true;
  entryForm: FormGroup;



  @ViewChild(DatatableComponent) table: DatatableComponent;
  selection: SelectionType;
  isEditMode: boolean = false;
  entyTypeId: any;


  constructor(private socketService: SocketService, private fb: FormBuilder, private toastr: ToastrService, private datePipe: DatePipe) {
    this.entryForm = this.fb.group({
      name: ['', Validators.required]
    })

    this.selection = SelectionType.checkbox;
    this.fetch((data: any) => {
      this.temp = [...data];
      this.rows = data;
    });
  }
  ngOnInit(): void {
    this.Getallentry();
    this.getEntry();
    this.editListen()

    const sub5 = this.socketService.listen('ms-entry-type:create').subscribe((response: any) => {
      if (response.success) {
        this.toastr.success(response.message);
        this.entryForm.reset({
          name: '',

        });
        this.getEntry();
      } else {
        this.toastr.error(response.message);
      }
    });

    this.socketService.listen("ms-entry-type:update").subscribe((res: any) => {
      if (res.success) {
        this.toastr.success("Updated", res.message);
        this.entryForm.reset();
        this.getEntry();
      } else {
        this.toastr.error(res.message);
      }
    })
  }




  fetch(data: any) {
    const req = new XMLHttpRequest();
    req.open('GET', 'data/company.json');
    req.onload = () => {
      data(JSON.parse(req.response));
    };
    req.send();
  }

  editListen() {
    this.socketService.listen("ms-entry-type:by-id").subscribe((res: any) => {
      // ("ppp", res.data);
      const data = res.data;
      const id = data.entyTypeId;
      this.entryForm.patchValue({ ...data, name: data.name, entyTypeId: id });
      window.scrollTo({ top: 0, behavior: 'smooth' });

    })
    this.getEntry();
  }


  entry: any[] = []
  Getallentry() {
    this.socketService.listen('ms-entry-type:all').subscribe((res: any) => {
      if (res.success) {
        this.entry = res.data;
        this.temp = this.entry;

      }
    });
  }

  getEntry() {
    this.socketService.emit('ms-entry-type:all', {});
  }

  onSubmit() {

    if (this.entryForm.valid) {
      const formData = { ...this.entryForm.value, }
      this.socketService.emit('ms-entry-type:create', formData);


    } else {
      this.toastr.warning('Please fill all required fields.');
    }

  }

  deleteUserListen() {
    this.socketService.listen("ms-entry-type:delete").subscribe((res: any) => {
      if (res.success) {
        Swal.fire("Delete user", res.message, "success");
        return;
      }

      Swal.fire("Delete user", res.message, "error");

    })
  }

  deleteUser(entyTypeId: number,) {
    Swal.fire({
      title: 'Are you sure?',
      text: ` To delete user '${name}'  , You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.socketService.emit("ms-entry-type:delete", { entyTypeId });
      }
    });
  }

  updateEntry() {
    if (this.entryForm.valid) {
      const data = { ...this.entryForm.value, id: this.entyTypeId };
      this.socketService.emit("ms-entry-type:update", { ...data, entyTypeId: data.id });
    }
  }

  editName(entyTypeId: number): void {
    this.isEditMode = true;
    this.entyTypeId = entyTypeId;
    this.socketService.emit('ms-entry-type:by-id', { entyTypeId });

  }
  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const filteredData = this.temp.filter((item: any) => {
      const priorityText = item.is_deletable == 0 ? 'permanent' : 'temporary';
      // Create separate status check
      const statusMatch = val === 'active' ? item.status === 1 :
        val === 'deactive' || val === 'deact' ? item.status === 0 :
          false;
      return (
        // Search in all relevant fields
        (item.name?.toLowerCase().includes(val)) ||
        (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
        statusMatch || // Use the new status matching logic
        priorityText.includes(val) ||
        !val
      );
    });

    // update the rows
    this.entry = filteredData;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

}
