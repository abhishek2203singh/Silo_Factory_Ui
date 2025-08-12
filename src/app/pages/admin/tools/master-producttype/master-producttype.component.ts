import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, id, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-master-producttype',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
    templateUrl: './master-producttype.component.html',
    styleUrl: './master-producttype.component.scss'
})
export class MasterProducttypeComponent implements OnInit {
    proData: any[] = [];
    proTypeForm: FormGroup;
    isEditMode: boolean = false;
    id: number = 0;
    temp: any[] = [];
    @ViewChild(DatatableComponent) table: DatatableComponent;

    constructor(private socketService: SocketService, private fb: FormBuilder, public toastr: ToastrService, private datePipe: DatePipe) {
        this.proTypeForm = this.fb.group({
            name: ['', Validators.required],


        });
    }
    ngOnInit(): void {
        this.getProType();
        this.getAllproType();
        this.deleteProdDataListen();

        this.socketService.listen('error').subscribe((res: any) => {
            if (res.success!) {
                this.toastr.success(res.message)
            } else {
                this.toastr.error(res.message)
            }
        });

        this.socketService.listen("ms-product-type:update").subscribe((res: any) => {
            // // console.log("ms-product-type:update =< recived >", res);
            if (res.success) {

                this.toastr.success(res.message);
                this.proTypeForm.reset({
                    name: '',

                });
                return
            }

            this.toastr.error(res.message);
        });

        this.socketService.listen("ms-product-type:by-id").subscribe((res: any) => {
            const data = res.data;
            const { id, name } = res.data;
            this.proTypeForm.patchValue({ ...data, name: name, id: id });
            window.scrollTo({ top: 0, behavior: 'smooth' });

        });

        const sub5 = this.socketService.listen('ms-product-type:create').subscribe((response: any) => {
            if (response.success) {
                this.toastr.success(response.message);
                this.proTypeForm.reset({
                    name: '',

                });

                this.isEditMode = false;
            } else {
                this.toastr.error(response.message);
            }
        });
    }

    deleteProdDataListen() {
        this.socketService.listen('ms-product-type:delete').subscribe((res: any) => {
            if (res.success!) {
                this.toastr.success(res.message)
            } else {
                this.toastr.error(res.message)
            }
        });
    }
    deleteData(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Emit WebSocket event to delete product by ID
                this.socketService.emit('ms-product-type:delete', { id })
            }
        });
    }


    getAllproType() {
        this.socketService.listen('ms-product-type:all').subscribe((res: any) => {
            if (res?.success) {
                this.proData = res.data;
                this.temp = [...this.proData];
            }

        });
    }
    getProType() {
        this.socketService.emit('ms-product-type:all', {});
    }

    onSubmit() {
        if (this.proTypeForm.valid) {
            const formData = { ...this.proTypeForm.value, }
            this.socketService.emit('ms-product-type:create', formData);
        } else {
            this.toastr.warning('Please fill all required fields.');
        }
    }

    updateProduct() {
        if (this.proTypeForm.valid) {
            const data = { ...this.proTypeForm.value, id: this.id };
            this.socketService.emit("ms-product-type:update", { ...data, id: data.id });
        }
    }

    editProType(proId: number): void {
        this.isEditMode = true;
        this.id = proId;
        this.socketService.emit('ms-product-type:by-id', { id: proId });
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            return (
                // Search in all relevant fields
                (item.name?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                !val
            );
        });

        // update the rows
        this.proData = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
}
