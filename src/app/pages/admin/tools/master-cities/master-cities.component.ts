import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-master-cities',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
    templateUrl: './master-cities.component.html',
    styleUrl: './master-cities.component.scss'
})
export class MasterCitiesComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    selected: any[] = [];
    reorderable: boolean = true;
    cityList: any[] = [];
    private subscriptions: Subscription[] = [];
    cityForm: FormGroup;
    cityId: number = 0;

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    isEditMode: boolean = false;


    constructor(private socketService: SocketService, private toastr: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
        this.cityForm = this.fb.group({
            cityName: ['', Validators.required],
            stateId: ['', Validators.required]
        })
    }
    ngOnInit(): void {
        this.getState();
        this.getAllstate();
        this.editcityListen();
        this.getAllListen()

        const sub5 = this.socketService.listen('ms-cities:create').subscribe((response: any) => {
            if (response.success) {
                this.toastr.success(response.message);
                this.cityForm.reset({
                    cityName: '',
                });
            } else {
                this.toastr.error(response.message);
            }
        });

        const sub6 = this.socketService.listen("location:cities").subscribe((response: any) => {
            if (response.success) {
                this.cityList = response.data;
                this.temp = [...this.cityList]
            } else {
                this.toastr.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub6);

        this.socketService.listen("ms-cities:update").subscribe((res: any) => {
            if (res.success) {
                this.toastr.success(res.message);
                this.cityForm.reset({
                    cityName: '',
                });
            } else {
                this.toastr.error(res.message)
            }
        })
    }
    editcityListen() {
        this.socketService.listen("ms-cities:by-id").subscribe((res: any) => {
            if (res.success) {
                const data = res.data;

                // Ensure you're setting all necessary form values
                this.cityForm.patchValue({
                    stateId: data.state_id, // Make sure this matches the state ID
                    cityName: data.name,
                    cityId: data.id
                });

                // Scroll to top for better UX
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                this.toastr.error('Failed to fetch city details');
            }
        });
    }
    stateList: any[] = [];
    getAllstate() {
        this.socketService.listen('location:states').subscribe((res: any) => {
            if (res?.success) {
                this.stateList = res.data;
                // this.temp=[...this.stateList];
            }

        })
    }
    getState() {
        this.socketService.emit('location:states', {});
    }

    onStateChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const stateId = Number(target.value);
        if (!isNaN(stateId) && stateId !== 0) {
            this.socketService.emit("location:cities", { stateId });
        } else {
            this.cityList = [];
        }
    }

    onSubmit() {
        if (this.cityForm.valid) {
            const formData = { ...this.cityForm.value };
            this.socketService.emit('ms-cities:create', formData);

            // Reset form
            this.cityForm.reset();
            this.isEditMode = false;
            this.cityId = 0;
        } else {
            this.toastr.warning('Please fill all required fields.');
        }
    }

    getAllListen() {
        this.socketService.listen('ms-cities:all').subscribe((res: any) => {
            if (res.success) {
                this.cityList = res.data;
                // this.temp = [...this.cityList];
            }

        });
    }

    getAll() {
        this.socketService.emit('ms-cities:all', {});
    }

    editCity(cityId: number): void {
        this.isEditMode = true;
        this.cityId = cityId;

        // Clear any previous form state
        this.cityForm.reset();

        // Emit the event to fetch city details
        this.socketService.emit('ms-cities:by-id', { cityId });
    }
    updateCity() {
        if (this.cityForm.valid) {
            const data = {
                ...this.cityForm.value,
                id: this.cityId,
                stateId: this.cityForm.get('stateId')?.value // Ensure state ID is passed
            };

            this.socketService.emit("ms-cities:update", {
                ...data,
                cityId: data.id
            });

            // Reset form and edit mode
            this.cityForm.reset();
            this.isEditMode = false;
            this.cityId = 0;
        } else {
            this.toastr.warning('Please fill all required fields.');
        }
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
        this.cityList = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
}
