import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { Router } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import City from '../../../Models/city.model';
import State from '../../../Models/state.model';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';

@Component({
    selector: 'app-customer-details',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    baseImgUrl: string;
    currentPic: string = "1724994358500.png";
    cityList: City[] = [];
    stateList: State[] = [];
    isFileUploading: boolean = false;
    uploadResult: any;
    currentUserId: number;
    userForm: FormGroup;
    selectedState: { id: number, name: string } | null = null;
    isLoadingStates: boolean = false;
    isLoadingCities: boolean = false;

    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;

    constructor(
        private router: Router,
        protected baseService: BaseService,
        private utilityServices: UtilityService,
        private fb: FormBuilder,
        private socketService: SocketService,
        private toaster: ToastrService,
    ) {
        this.initializeForm();
        this.baseImgUrl = this.baseService.imageurl;
    }

    private initializeForm(): void {
        this.userForm = this.fb.group({
            profile_photo: [''],
            full_name: ['', Validators.required],
            mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            address: ['', Validators.required],
            state: ['', Validators.required],
            city: ['', Validators.required],
            pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
            status: ['', Validators.required],
            gender: ['male', Validators.required],
            role_id: ['', Validators.required],
            department_id: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.setupSocketListeners();
        this.loadInitialData();
    }

    private setupSocketListeners(): void {
        // Listen for city updates
        this.socketService.listen("location:cities").subscribe((res: any) => {
            this.isLoadingCities = false;
            if (res.success) {
                this.cityList = res.data;
            } else {
                this.toaster.error(res.message);
                if (res.error == 402) {
                    this.socketService.Logout();
                }
            }
        });

        // Listen for state updates
        this.socketService.listen("location:states").subscribe((res: any) => {
            this.isLoadingStates = false;
            if (res?.success) {
                this.stateList = res.data;
                // After getting states, load user data
                this.getCurrentUserData();
            } else {
                this.toaster.error(res.message);
                if (res.error == 402) {
                    this.socketService.Logout();
                }
            }
        });

        // Listen for user updates
        this.socketService.listen("user:update").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
                this.getCurrentUserData();
            } else {
                this.toaster.error(res.message);
            }
        });
    }

    private loadInitialData(): void {
        this.getCurrentUser();
        this.loadStates();
        this.updateFormDataListen();
    }

    private loadStates(): void {
        this.isLoadingStates = true;
        this.socketService.emit("location:states", {});
    }

    getCurrentUser(): void {
        const user = this.utilityServices.getCurrentUser();
        if (user) {
            this.currentUserId = user.id;
        } else {
            this.toaster.error("No current user found");
            this.router.navigate(['/login']);
        }
    }

    getCurrentUserData(): void {
        if (!this.currentUserId) return;

        this.socketService.emit("user:get-user-by-id", { userId: this.currentUserId });
        this.socketService.listen("user:get-user-by-id").subscribe((res: any) => {
            if (res.success) {
                const userData = res.data;
                // Set profile picture first
                if (userData.profile_photo) {
                    this.currentPic = userData.profile_photo;
                }
                // Find and set selected state
                if (userData.state && this.stateList) {
                    const selectedState = this.stateList.find(state => state.id === userData.state);
                    if (selectedState) {
                        this.selectedState = selectedState;
                        // Load cities for the selected state
                        this.getCities(selectedState.id);
                    }
                }

                // Update form with user data
                this.userForm.patchValue({
                    profile_photo: this.currentPic,
                    full_name: userData.full_name,
                    mobile: userData.mobile,
                    email: userData.email,
                    password: userData.password,
                    address: userData.address,
                    state: userData.state,
                    city: userData.city,
                    pincode: userData.pincode,
                    status: userData.status,
                    gender: userData.gender,
                    role_id: userData.role_id,
                    department_id: userData.department_id,
                });
            } else {
                this.toaster.error(res.message);
            }
        });
    }

    getCities(stateId: any): void {
        if (!stateId) return;

        this.isLoadingCities = true;
        this.userForm.patchValue({ city: '' }); // Reset city when state changes
        this.socketService.emit("location:cities", { stateId: stateId });
    }

    async uploadFile(file: any): Promise<void> {
        if (!file || file.length === 0) return;

        this.isFileUploading = true;
        try {
            this.uploadResult = await this.utilityServices.uploadImageUtility(file);

            if (this.uploadResult.error) {
                Swal.fire("Error", "Unable to upload file!", 'warning');
            } else {
                this.currentPic = this.uploadResult.Filename;
                this.userForm.patchValue({ profile_photo: this.currentPic });
            }
        } catch (error) {
            Swal.fire("Error", "File upload failed!", 'error');
        } finally {
            this.isFileUploading = false;
        }
    }

    onUpdateFormData(): void {
        if (this.userForm.valid) {
            const formData = {
                ...this.userForm.value,
                profile_photo: this.currentPic,
                id: this.currentUserId
            };
            this.socketService.emit("user:update", formData);
        } else {
            this.toaster.error("Please fill all required fields correctly");
        }
    }

    updateFormDataListen(): void {
        this.socketService.listen("user:update").subscribe((res: any) => {
            if (res.success) {
                this.toaster.success(res.message);
                this.getCurrentUserData();
            } else {
                this.toaster.error(res.message);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/pages/customer']);
    }

    // Helper method to check if a form control is invalid
    isFieldInvalid(fieldName: string): boolean {
        const field = this.userForm.get(fieldName);
        return field ? (field.invalid && (field.dirty || field.touched)) : false;
    }

    // Helper method to get error message
    getErrorMessage(fieldName: string): string {
        const control = this.userForm.get(fieldName);
        if (control?.errors) {
            if (control.errors['required']) return `${fieldName} is required`;
            if (control.errors['email']) return 'Invalid email format';
            if (control.errors['pattern']) {
                if (fieldName === 'mobile') return 'Mobile number must be 10 digits';
                if (fieldName === 'pincode') return 'Pincode must be 6 digits';
            }
        }
        return '';
    }
}