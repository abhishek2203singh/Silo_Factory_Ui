import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import City from '../../../Models/city.model';
import State from '../../../Models/state.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';
import { BaseService } from '@services/Base.service';
import { PrintService } from '@services/print.service';
@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        NgxDatatableModule, CommonModule, FormsModule, ReactiveFormsModule
    ],
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
    // ******************************************************************
    editing: any = {};
    rows: any[] = [];
    temp: any[] = [];
    selected: any[] = [];
    loadingIndicator: boolean = true;
    reorderable: boolean = true;
    stateList: State[];
    cityList: City[];
    departmentList: Department[];
    roleList: Department[];
    userForm: FormGroup;
    currentPic: string = "1724994358500.png";
    users: any[] = [];
    isFileUploading: boolean = false;
    uploadResult: any;
    baseImgUrl: string;
    modal: any;
    isEditUser: boolean = false;
    editUserId: number = 0; // id of user which is to be updated
    // **************************************************************************
    private subscriptions: Subscription[] = [];
    @ViewChild(DatatableComponent) table: DatatableComponent;
    selection: SelectionType;
    @ViewChild('openButton') openButton: ElementRef | undefined; // refrence to the open form
    @ViewChild('closeButton') closeButton: ElementRef | undefined; // refrence to the close form
    columns = [
        { prop: 'name' },
        { name: 'Gender' },
        { name: 'Company' }
    ];
    constructor(
        private socketService: SocketService,
        private toaster: ToastrService,
        private router: Router,
        protected fb: FormBuilder,
        private utilityServices: UtilityService,
        protected baseService: BaseService,
        private printService: PrintService,
        private datePipe: DatePipe
    ) {
        this.baseImgUrl = this.baseService.imageurl;
        this.userForm = this.fb.group({
            full_name: ['', Validators.required],
            mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            address: ['', Validators.required],
            state: [null, Validators.required],
            city: [null, Validators.required],
            pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
            profile_photo: [],
            department_id: [null, Validators.required],
            role_id: [, Validators.required],
            gender: ["male", Validators.required],
            salary: [0],
            about_me: ['']
        });
        this.selection = SelectionType.checkbox;
    }
    ngOnInit(): void {
        // listner for error messages
        this.socketService.listen("error").subscribe((error: any) => {
            this.toaster.error(error.message);
            // ("error listner =>", error)
            if (error.error == 402) {
                this.socketService.Logout()
            }
        })
        // get all users
        this.socketService.listen("user:all").subscribe((res: any) => {
            if (res.success) {
                this.rows = res?.data;
                this.temp = [...this.rows]; // Create a copy of the initial data
                // this.table.recalculate();
                return;
            }
            this.toaster.error(res.message);
        });
        // listener of upadate user profile
        this.socketService.listen("user:update").subscribe((res: any) => {
            // ("user:updated =>", res);
            if (res.success) {
                this.toaster.success("update user", res.message);
                this.getAllUsers();
                this.closeForm();
                this.getAllUsers();
                // this.fetch((data: any) => {
                //     this.temp = [...data];
                //     this.rows = data;
                //     this.table.recalculate()
                // })
                return;
            }
            this.toaster.error(res.message);
        })
        // to delele user
        this.socketService.listen("user:delete").subscribe((res: any) => {
            if (res.success) {
                // this.toaster.success("Delete User", res.message);
                Swal.fire("Delete user", res.message, "success");
                this.getAllUsers();
                return;
            }
            Swal.fire("Delete user", res.message, "error");
        })
        // get all states 
        this.socketService.emit("location:states", {});
        const subscriber = this.socketService.listen("location:cities").subscribe((res: any) => {
            // ("citites =>", res.data)
            if (res.success) {
                this.cityList = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.socketService.Logout()
            }
        })
        // get all departmentList
        this.socketService.emit("department:all", {});
        this.socketService.listen("department:all").subscribe((res: any) => {
            if (res?.success) {
                this.departmentList = res.data;
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })
        // get all roler
        this.socketService.emit("role:all", {});
        this.socketService.listen("role:all").subscribe((res: any) => {
            if (res.success) {
                this.roleList = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error = 402) {
                this.router.navigate(['/login']);
                return
            }
        })
        // to listen for user create
        this.socketService.listen("user:register").subscribe((res: any) => {
            // ("citites =>", res.data)
            if (res.success) {
                this.toaster.success(res.event, res.message)
                this.userForm.reset();
                this.closeForm();
                this.getAllUsers();
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })
        // listener to get user details
        this.socketService.listen("user:get-user-by-id").subscribe((res: any) => {
            try {
                if (res.success) {
                    const { data } = res;
                    // console.table(data)
                    this.getCities(data.state);
                    this.userForm.patchValue({
                        ...data,
                        salary: parseFloat(data.salary),
                        pincode: parseFloat(data.pincode),
                        city: data.city,
                        state: data.state,
                    });
                    if (data.profile_photo) {
                        this.currentPic = data.profile_photo
                    }
                    this.openForm();
                }
            } catch (error) {
            }
        })
        //         
        this.getStates();
        this.getDepartments();
        this.getRoles();
        this.getAllUsers();
    }
    //    to open add / update user form 
    openForm() {
        this.openButton?.nativeElement?.click();
    }
    // close add /update user form
    closeForm() {
        this.userForm.reset();
        this.isEditUser = false;
        this.editUserId = 0;
        this.closeButton?.nativeElement?.click();
    }
    // to open dialog box of user details 
    editUser(userId: number) {
        // console.log("userID =>", userId);
        this.isEditUser = true;
        this.editUserId = userId;
        this.socketService.emit("user:get-user-by-id", { userId });
    }
    // delete user
    // save user details to database
    updateUser() {
        if (this.userForm.valid) {
            const data = { ...this.userForm.value, profile_photo: this.currentPic, id: this.editUserId };
            // ("update form data =>", data);
            this.socketService.emit("user:update", data);
        }
    }
    deleteUser(userId: number, name: string) {
        // ("delete userId =>", userId);
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
                // Listen for the response from the server
                this.socketService.emit("user:delete", { userId });
            }
        });
    }
    // 
    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }
    async uploadFile(file: any) {
        this.isFileUploading = true;
        this.uploadResult = await this.utilityServices.uploadImageUtility(file);
        if (this.uploadResult.error) {
            Swal.fire("something went wrong", "unable to upload file !", 'warning');
            this.isFileUploading = false;
        }
        else {
            // ("uploadResult =>", this.uploadResult)
            this.currentPic = this.uploadResult.Filename;
            // ("currentPic =>", this.currentPic)
        }
        // ("file upload result=> ", this.uploadResult)
    }
    getAllUsers() {
        this.socketService.emit("user:all", {});
    }
    getCities(stateId: any) {
        this.cityList = [];
        this.socketService.emit("location:cities", { stateId: stateId });
    }
    createUser() {
        const data = { ...this.userForm.value, profile_photo: this.currentPic, salary: 0 }
        // ("hitted =>",)
        // ("form =>", data)
        if (this.userForm.valid) {
            this.socketService.emit("user:register", data);
        }
    }
    // fetch(callback: (data: any) => void) {
    //     callback(this.users)
    // }
    // get states
    getStates() {
        const subscriber = this.socketService.listen("location:cities").subscribe((res: any) => {
            // ("citites =>", res.data)
            if (res.success) {
                this.cityList = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error = 402) {
                this.router.navigate(['/login']);
                return
            }
        })
        this.socketService.emit("location:states", {});
        this.socketService.listen("location:states").subscribe((res: any) => {
            // ("data : ", res.data)
            if (res?.success) {
                this.stateList = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.socketService.Logout()
            }
        })
    }
    // get departments
    getDepartments() {
        this.socketService.emit("department:all", {});
        this.socketService.listen("department:all").subscribe((res: any) => {
            if (res?.success) {
                this.departmentList = res.data;
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.router.navigate(['/login']);
                return
            }
        })
    }
    // get rolers
    getRoles() {
        // get all roles
        this.socketService.emit("role:all", {});
        this.socketService.listen("role:all").subscribe((res: any) => {
            if (res.success) {
                this.roleList = res.data
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.socketService.Logout()
            }
        })
    }
    // global
    erorListner() {
        const sub = this.socketService.listen("error").subscribe((res: any) => {
            // ("citites =>", res.data)
            if (res.success) {
                this.toaster.success(res.event, res.messge)
                return
            }
            this.toaster.error(res.message)
            if (res.error == 402) {
                this.socketService.Logout()
            }
        })
        this.subscriptions.push(sub);
    }
    // Updated filter function to search across all relevant fields
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            return (
                // Search in all relevant fields
                (item.full_name?.toLowerCase().includes(val)) ||
                (item.mobile?.toString().toLowerCase().includes(val)) ||
                (item.address?.toLowerCase().includes(val)) ||
                (item.city_name?.toLowerCase().includes(val)) ||
                (item.department_name?.toLowerCase().includes(val)) ||
                (item.role_name?.toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.joining_date, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                !val
            );
        });
        // update the rows
        this.rows = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
    updateValue(event: any, cell: any, row: any) {
        this.editing[row.$$index + '-' + cell] = false;
        this.rows[row.$$index][cell] = event.target.value;
    }
    onSelect({ selected }: any) {
        // ('Select Event', selected, this.selected);
        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }
    previewImageUrl: string;
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Name', 'Mobile No.', 'Address', 'City', 'Department', 'Role', 'Joining Date', 'Status'];
        csvData.push(headers.join(','));
        this.rows.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                row.full_name,
                row.mobile,
                row.address,
                row.city_name,
                row.department_name,
                row.role_name,
                new Date(row.joining_date).toLocaleDateString(),  // Formatted date
                row.status == "0" ? "Deactive" : "Active",
            ];
            csvData.push(rowData.map(item => `"${item}"`).join(',')); // Add quotes to escape commas in fields
        });
        const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    printFile() {
        const headers = ['Sr. No', 'Name', 'Mobile No.', 'Address', 'City', 'Department', 'Department Head', 'Joining Date', 'Status'];
        this.printService.print(headers, this.rows, (row, index) => [
            (index + 1).toString(),
            row.full_name,
            row.mobile,
            row.address,
            row.city_name,
            row.department_name,
            row.role_name,
            new Date(row.joining_date).toLocaleDateString(),  // Formatted date
            row.status == "0" ? "Deactive" : "Active",
        ]);
    }
}
type Department = {
    id: number,
    name: string
};
export default Department;

