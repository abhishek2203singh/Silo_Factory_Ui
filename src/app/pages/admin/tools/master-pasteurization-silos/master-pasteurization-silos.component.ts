import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-master-pasteurization-silos',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
    templateUrl: './master-pasteurization-silos.component.html',
    styleUrl: './master-pasteurization-silos.component.scss'
})
export class MasterPasteurizationSilosComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    selected: any[] = [];
    reorderable: boolean = true;
    psSilosForm: FormGroup;
    siloId: number = 0;

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    isEditMode: boolean = false;
    constructor(private socketService: SocketService, public toastr: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
        this.psSilosForm = this.fb.group({
            siloName: ['', Validators.required],
            capacity: ['', Validators.required],
            availableMilk: ['', Validators.required]
        });
    }
    ngOnInit(): void {
        this.getAllpsSilos();
        this.getPsSilos();
        this.editPsilosListen();

        const sub6 = this.socketService.listen('error').subscribe((response: any) => {
            this.toastr.error(response.message);

        });

        const sub5 = this.socketService.listen('ms-ps-silo:create').subscribe((response: any) => {
            if (response.success) {
                this.toastr.success(response.message);
                this.psSilosForm.reset({
                    siloName: '',
                    capacity: '',
                    availableMilk: ''
                });
                this.isEditMode = false;
            } else {
                this.toastr.error(response.message);
            }
        });

        this.socketService.listen("ms-ps-silo:update").subscribe((res: any) => {
            if (res.success) {
                this.toastr.success(res.message);
                this.psSilosForm.reset({
                    siloName: '',
                    capacity: '',
                    availableMilk: ''
                });
                // (res.message);
                return;
            }
            this.toastr.error(res.message);

        })
    }
    editPsilosListen() {
        this.socketService.listen("ms-ps-silo:by-id").subscribe((res: any) => {
            const data = res.data;
            const siloId = data.id;
            const capacity = data.capacity;
            const availableMilk = data.total_available_milk;
            const { id, silo_name, total_available_milk } = res.data;
            this.psSilosForm.patchValue({ ...data, siloName: silo_name, capacity: capacity, availableMilk: total_available_milk, siloId: id, });
            // to the top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        this.getPsSilos();
    }
    psSilos: any[] = [];
    getAllpsSilos() {
        this.socketService.listen('ms-ps-silo:all').subscribe((res: any) => {
            if (res?.success) {
                this.psSilos = res.data;
                this.temp = [...this.psSilos];
            }
        })
    }
    getPsSilos() {
        this.socketService.emit('ms-ps-silo:all', {});
    }





    onSubmit() {
        if (this.psSilosForm.valid) {
            const formData = { ...this.psSilosForm.value, }
            this.socketService.emit('ms-ps-silo:create', formData);
        } else {
            this.toastr.warning('Please fill all required fields.');
        }
        // ("Success", this.toastr.success);
    }
    editPsilos(id: number): void {
        this.isEditMode = true;
        this.siloId = id;
        this.socketService.emit('ms-ps-silo:by-id', { siloId: id });
    }
    updatePsSilos() {
        if (this.psSilosForm.valid) {
            const data = { ...this.psSilosForm.value, id: this.siloId };
            this.socketService.emit("ms-ps-silo:update", { ...data, siloId: data.id });
        }
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            // Convert numeric status to string (Active/Deactive) for filtering
            const statusText = item.status === 1 ? 'active' : 'deactive';
            return (
                // Search in all relevant fields
                (item.silo_name?.toLowerCase().includes(val)) ||
                (item.capacity?.toString().toLowerCase().includes(val)) ||
                (item.total_available_milk?.toString().toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                statusText.includes(val) || // Check against "active" or "deactive"

                !val
            );
        });

        // update the rows
        this.psSilos = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
}
