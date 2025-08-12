import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgToggleModule } from 'ng-toggle-button';
@Component({
    selector: 'app-master-distribution-center',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, NgToggleModule],
    templateUrl: './master-distribution-center.component.html',
    styleUrl: './master-distribution-center.component.scss'
})
export class MasterDistributionCenterComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[] = [];
    selected: any[] = [];
    distribution: any[] = [];
    reorderable: boolean = true;
    DistForm: FormGroup;
    stateList: any[] = [];
    cityList: any[] = [];
    List: any[] = [];
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    isEditMode: boolean = false;
    id: string;
    pendingcity: number | null = null;
    submitting: boolean = false;

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;

    constructor(private socketService: SocketService, private toaster: ToastrService, private toastr: ToastrService, private fb: FormBuilder, private datePipe: DatePipe) {
        this.initForm();
    }

    initForm(): void {
        this.DistForm = this.fb.group({
            centerName: ['', [Validators.required]],
            centerCode: ['', [Validators.required]],
            address: ['', [Validators.required]],
            city: [{ value: '', disabled: true }, [Validators.required]],
            state: ['', [Validators.required]],
            mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
            manager: ['', [Validators.required]],
            pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        this.getEmit();
        this.getAllstate();
        this.subscribeToSocketEvents();
        this.editDistdprtListen();

        const sub1 = this.socketService.listen('ms-disribution-center:create').subscribe((response: any) => {
            this.submitting = false;
            if (response.success) {
                this.toastr.success(response.message);
                this.resetForm();
            } else {
                this.toastr.error(response.message);
            }
        });


        this.socketService.emit("user:alldistributionmanager", {});
        this.socketService.listen("user:alldistributionmanager").subscribe((res: any) => {
            if (res.success) {
                this.List = res.data
                //// console.log("list",this.List);
                return
            }

            this.toaster.error(res.message)
        })

        this.socketService.listen("ms-disribution-center:update").subscribe((res: any) => {
            if (res.success) {
                this.toastr.success(res.message);
                this.DistForm.reset({
                    centerName: '',
                    centerCode: '',
                    address: '',
                    state: '',
                    city: '',
                    mobile: '',
                    manager: '',
                    pincode: '',
                    email: '',
                });

                return;
            }
            this.toastr.error(res.message);

        });

    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    subscribeToSocketEvents(): void {
        const sub2 = this.socketService.listen('ms-disribution-center:all').subscribe((res: any) => {
            if (res.success) {
                this.distribution = res.data;
                this.temp = [...this.distribution];
                //// console.log("ddd",this.distribution);

            }
        });

        const sub3 = this.socketService.listen('location:states').subscribe((res: any) => {
            if (res?.success) {
                this.stateList = res.data;
            }
        });

        const sub4 = this.socketService.listen('location:cities').subscribe((response: any) => {
            if (response.success) {
                this.cityList = response.data;
                if (this.pendingcity !== null) {
                    this.DistForm.get('city')?.enable();
                    this.DistForm.patchValue({ city: this.pendingcity });
                    this.pendingcity = null;
                }
            } else {
                this.toastr.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });

        this.subscriptions.push(sub2, sub3, sub4);

        this.socketService.listen("ms-disribution-center:delete").subscribe((res: any) => {
            if (res.success) {
                Swal.fire("Delete user", res.message, "success");
                this.getEmit();
                return;
            }

            Swal.fire("Delete user", res.message, "error");

        })
    }
    editDistdprtListen() {
        this.socketService.listen("ms-disribution-center:by-id").subscribe((res: any) => {
            if (res.success && res.data) {
                const data = res.data;
                this.pendingcity = data.cityId;

                this.DistForm.patchValue({
                    centerName: data.center_name,
                    centerCode: data.center_code,
                    address: data.address,
                    state: data.stateId,
                    city: data.cityId,
                    mobile: data.mobile,
                    manager: data.full_name,
                    pincode: data.pincode,
                    email: data.email
                });


                this.DistForm.get('city')?.enable();


                this.socketService.emit("location:cities", { stateId: data.stateId });


                const manager = this.List.find(role => role.full_name === data.full_name);
                if (manager) {
                    this.DistForm.patchValue({ manager: manager.id });
                }

                // to the top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    updateDetails() {
        if (this.DistForm.valid) {
            const data = { ...this.DistForm.value, Id: this.id };
            this.socketService.emit("ms-disribution-center:update", { ...data, id: data.Id });
        }
    }

    deleteData(Id: number) {
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

                this.socketService.emit("ms-disribution-center:delete", { id: Id });
            }
        });

    }

    resetForm() {
        this.DistForm.reset();
        this.isEditMode = false;
        this.id = '';
        this.pendingcity = null;
        this.DistForm.get('city')?.disable();
        this.getEmit();
    }

    getEmit() {
        this.socketService.emit('ms-disribution-center:all', {});
    }

    getAllstate() {
        this.socketService.emit('location:states', {});
    }

    onStateChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const stateId = Number(target.value);
        if (!isNaN(stateId) && stateId !== 0) {
            this.socketService.emit("location:cities", { stateId });
            this.DistForm.get('city')?.enable();
        } else {
            this.cityList = [];
            this.DistForm.get('city')?.disable();
            this.DistForm.get('city')?.setValue('');
        }
    }

    validateForm(): boolean {
        // Mark all fields as touched to trigger validation messages
        Object.keys(this.DistForm.controls).forEach(key => {
            const control = this.DistForm.get(key);
            control?.markAsTouched();
        });

        // Check if state is selected
        if (!this.DistForm.get('state')?.value) {
            this.toastr.warning('Please select a state');
            return false;
        }

        // Check if city is selected when enabled
        const cityControl = this.DistForm.get('city');
        if (cityControl?.enabled && !cityControl.value) {
            this.toastr.warning('Please select a city');
            return false;
        }

        // Check if the form is valid
        if (!this.DistForm.valid) {
            this.toastr.warning('Please fill all required fields correctly');
            return false;
        }

        return true;
    }

    onSubmit() {
        if (this.DistForm.valid) {
            const formData = this.DistForm.value;
            this.socketService.emit('ms-disribution-center:create', formData);
        } else {
            this.toastr.warning('Please fill all required fields correctly.');
        }
    }

    onEditDistdprt(DisId: string) {
        this.isEditMode = true;
        this.id = DisId;
        this.socketService.emit('ms-disribution-center:by-id', { id: DisId });
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            // Convert numeric status to string (Active/Deactive) for filtering
            const statusText = item.status === 1 ? 'active' : 'deact';
            const priorityText = item.is_deletable === 0 ? 'permanent' : 'temporary';
            return (
                // Search in all relevant fields
                (item.center_name?.toLowerCase().includes(val)) ||
                (item.center_code?.toLowerCase().includes(val)) ||
                (item.full_name?.toLowerCase().includes(val)) ||
                (item.address?.toLowerCase().includes(val)) ||
                (item.stateName?.toLowerCase().includes(val)) ||
                (item.cityName?.toLowerCase().includes(val)) ||
                (item.pincode?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                statusText.toLowerCase().includes(val) || // Check against "active" or "deactive"
                priorityText.includes(val) ||
                !val
            );
        });

        // update the rows
        this.distribution = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
}