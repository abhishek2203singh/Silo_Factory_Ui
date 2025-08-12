import { FullScreenComponent } from '@components/fullscreen/fullscreen.component';
import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, viewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '@services/Socket.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InfoPanelsComponent, InfoPanelData } from '../../dashboard/info-panels/info-panels.component';
import { FileUploaderComponent } from "../../form-elements/controls/file-uploader/file-uploader.component";
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';
import { BaseService } from '@services/Base.service';
import { Router } from '@angular/router';
import { PrintService } from '@services/print.service';
import { IproductType } from '../../../Models/productType.model';
import { Iproduct } from '../../../Models/product';
declare var $: any; // For jQuery/Bootstrap modal
@Component({
    selector: 'app-quality-dashboard',
    standalone: true,
    imports: [
        InfoPanelsComponent,
        NgxDatatableModule,
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './quality-dashboard.component.html',
    styleUrls: ['./quality-dashboard.component.scss']
})
export class QualityDashboardComponent implements OnInit, OnDestroy {
    @ViewChild(DatatableComponent) table!: DatatableComponent;

    @ViewChild('lgModal') lgModal: any;
    // previewImageUrl: string | null = null;
    selectedPreviewImage: string | null = null;
    previewImageUrl: any
    productForm: FormGroup
    blockForm: FormGroup;
    Fulldata: any[] = [];
    selected: any[] = [];
    temp: any[] = [];
    isFileUploading: boolean = false;
    uploadResult: any;
    loadingIndicator = true;
    reorderable = true;
    selection: SelectionType = SelectionType.checkbox;
    baseImageUrl: string;
    selectedVendor: number = 0;
    selectedProduct: number = 0;

    // previewImageUrl?: string;
    namesList: any[] = [];
    unitList: any[] = [];
    departmentList: any[] = [];
    vendorList: any[] = [];
    departmentheadList: any[] = [];
    baseImgUrl: string;
    defaultPic: string;
    infoPanels: InfoPanelData[] = [];
    packingList: any[] = [];
    // Add new properties to store full lists
    fullProductTypeList: IproductType[] = [];
    fullNamesList: Iproduct[] = [];
    private subscriptions: Subscription[] = [];
    isEditMode: boolean = false;
    productTypeList: any[] = [];
    productData: any[] = [];
    depart: any;

    editUserId: number = 0; // id of user which is to be updated
    user: any;
    constructor(
        public toastr: ToastrService,
        private socketService: SocketService,
        private fb: FormBuilder,
        private toaster: ToastrService,
        private modalService: NgbModal,
        private utilityServices: UtilityService,
        protected baseService: BaseService,
        private router: Router,
        private printService: PrintService,
        private datePipe: DatePipe

    ) {
        this.baseImgUrl = this.baseService.imageurl;
        this.defaultPic = "bill-preview.png"

        this.selection = SelectionType.checkbox;
        this.blockForm = this.fb.group({
            vendorId: [0, Validators.required],
            productId: [0, Validators.required],
            quantity: [0, [Validators.required, Validators.min(0)]],
            unitId: [0, Validators.required],
            packingSizeId: [0],
            productTypeId: [0, Validators.required],
            pricePerUnit: [0, [Validators.required, Validators.min(0)]],
            departmentId: [0, Validators.required],
            departmentHeadId: [0],
            bill_image: [0]
        });
        this.baseImgUrl = this.baseService.imageurl;
        this.productForm = this.fb.group({
            productName: [0, Validators.required],
            unitId: [0, Validators.required],
            hasGst: [false, Validators.required],
            productType: [0, Validators.required],
            productImage: [0, Validators.required],
            roughProductId: [0, Validators.required],
            status: [1, Validators.required],
            freshPrice: [1, Validators.required],
            packedPrice: [1, Validators.required],
            salePrice: [0],
            deliveryCharge: [0],
            discount: [0],

        });
    }
    @ViewChild("closeButton") closeButton: ElementRef | undefined;
    close() {
        this.closeButton?.nativeElement.click();
    }

    ngOnInit() {
        this.loadData();
        this.getProduct();
        this.getpriceListen()
        this.socketService.listen("ms-packing-size:by-product-id").subscribe((unit: any) => {
            this.packingList = unit.data;
        })
        const sub8 = this.socketService.listen("listen:Quality_Control").subscribe((res: any) => {
            if (res.success) {
                this.Fulldata = res?.data;
                // this.rows = res?.data;
                this.temp = [...this.Fulldata]; // Create a copy of the initial data
            } else {
                this.toaster.error(res.message);
            }
            this.updateInfoPanels();
        });
        this.subscriptions.push(sub8);
        const pp = this.socketService.listen("ms-vender-product:product-types").subscribe((vendor: any) => {
            this.productTypeList = vendor.data;
            // // console.log("productTypeList data=>", this.productTypeList);
        })

        this.subscriptions.push(pp)
        this.socketService.listen('quality:delete-vendor-by-id').subscribe((response: any) => {
            // ("data", response)
            if (response.success) {
                // // console.log(response)
                Swal.fire(
                    'Deleted!',
                    'Your product has been deleted.',
                    'success'
                );
                return;
            }
            Swal.fire(
                'Error!',
                'There was an issue deleting the product.',
                'error'
            );

        })
        const sub = this.socketService.listen("vendor:all").subscribe((vendor: any) => {
            if (vendor.success) {
                this.vendorList = vendor.data;
            } else {
                this.toaster.error(vendor.message);
            }
        });
        this.subscriptions.push(sub);


        // this.subscriptions.push(sub1);
        const subBrod = this.socketService.listen("Quality_Control").subscribe((res: any) => {
            if (res.success) {
                this.departmentheadList = res.data;
            } else {
                this.toaster.error(res.message);
                if (res.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(subBrod);

        const sub2 = this.socketService.listen("ms-unit:all").subscribe((unit: any) => {
            if (unit.success) {
                // // console.log(unit)
                this.unitList = unit.data;
            }
            else {
                this.toaster.error(unit.message);
                if (unit.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub2);

        const sub3 = this.socketService.listen("department:all").subscribe((department: any) => {
            if (department.success) {
                this.departmentList = department.data;
            } else {
                this.toaster.error(department.message);
                if (department.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub3);

        const sub4 = this.socketService.listen('quality:get-vendor-by-id').subscribe((rowData: any) => {
            const { data } = rowData;
            // console.log("Data =>", data);

            window.scrollTo({ top: -200, behavior: 'smooth' });
            // // console.log(data);
            this.socketService.emit("department:head", {
                department_id: data.department_id,
                role_id: [11, 3]
            });

            this.socketService.emit("ms-vender-product:product-types", { id: data.vendor_id });

            this.socketService.emit("ms-vender-product:products-by-vendor", { id: data.vendor_id });

            this.socketService.emit("ms-packing-size:by-product-id", { productId: data.product_id });

            this.depart = data.department_id,
                this.blockForm.patchValue({
                    vendorId: Number(data.vendor_id),
                    productTypeId: Number(data.product_type_id),
                    productId: Number(data.product_id),
                    packingSizeId: Number(data.packing_size_id),
                    quantity: Number(data.quantity),
                    unitId: Number(data.unit_id),
                    pricePerUnit: Number(data.priceper_unit),
                    departmentId: Number(data.department_id),
                    departmentHeadId: Number(data.departmenthead_id),
                    bill_image: data.bill_image ? this.baseImgUrl + data.bill_image : null,
                });
            this.previewImageUrl = data.bill_image ? this.baseImgUrl + data.bill_image : null;
            // Fetch the product names and packing sizes based on the updated product type and product
            this.productbyproductType(data.product_type_id);
            this.packinggsizebyPrdct(data.product_id);


        });

        this.subscriptions.push(sub4);

        const sub5 = this.socketService.listen('vendor:entrygoods').subscribe((response: any) => {
            if (response.success) {
                // // console.log(response)
                this.toastr.success(response.message);
                this.blockForm.reset({
                    vendorId: 0,
                    productId: 0,
                    quantity: 0,
                    unitId: 0,
                    pricePerUnit: 0,
                    departmentId: 0,
                    departmentHeadId: 0,
                    bill_image: 0
                });
                this.isEditMode = false;
                this.defaultPic = "bill-preview.png";
                this.previewImageUrl = undefined;
            } else {
                this.toastr.error(response.message);
            }
        });
        this.subscriptions.push(sub5);

        const sub6 = this.socketService.listen("department:head").subscribe((response: any) => {
            if (response.success) {
                // // console.log(response)
                this.departmentheadList = response.data;
            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub6);

        // listener of upadate user profile
        this.socketService.listen("quality:update").subscribe((res: any) => {
            // ("quality:updated =>", res);
            if (res.success) {
                // // console.log(res)
                this.toaster.success("update quality", res.message);

                this.closeForm();
                this.previewImageUrl = this.defaultPic
                return;
            }

            this.toaster.error(res.message);

        })


        const sub7 = this.socketService.listen("quality:fetchtable").subscribe((response: any) => {
            if (response.success) {
                this.Fulldata = response.data;
                // console.log("fulldata", this.Fulldata);


            } else {
                this.toaster.error(response.message);
                if (response.error === 402) {
                    this.socketService.Logout();
                }
            }
        });
        this.subscriptions.push(sub7);


        const sub11 = this.socketService.listen("ms-packing-size:all").subscribe((allData: any) => {
            if (allData.success) {
                this.packingList = allData.data;
            } else {
                this.toaster.error(allData.message);
            }
        });
        this.subscriptions.push(sub11);
        this.socketService.listen('products:all').subscribe((res: any) => {
            // console.table(res)
            if (res.success) {
                this.productData = res.data;
                // console.table(this.productData)
                this.fullNamesList = [...res.data]; // Store full list
            } else {
                this.toastr.error(res.message);
            }
        });
        this.socketService.listen("ms-vender-product:products-by-vendor").subscribe((unit: any) => {
            this.namesList = unit.data;
            // // console.log("productTypeList data=>", this.namesList);
        })
    }
    getProduct() {
        // // Send a default payload with null or empty value
        // const payload = {
        //     ms_product_type_id: null  // or undefined, depending on your backend requirements
        // };
        this.socketService.emit("products:all", {});
    }

    async uploadFileproduct(file: any) {
        this.isFileUploading = true;
        // // console.log("local image details =>", file)
        this.uploadResult = await this.utilityServices.uploadImageUtility(file);
        // // console.log("uploadResult =>", this.uploadResult);

        if (this.uploadResult.error) {
            Swal.fire("Something went wrong", "Unable to upload file!", 'warning');
            this.isFileUploading = false;
        } else {
            // Update the form control with the file name
            this.productForm.patchValue({
                productImage: this.uploadResult?.Filename ?? ""
            });

            // Assign the uploaded file name to the defaultPic variable
            this.defaultPic = this.uploadResult.Filename;

            // Reset the file uploading state
            this.isFileUploading = false;
        }

        // // console.log("current data in for ", this.productForm.value)
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // fetch(callback: (data: any) => void) {
    //     this.socketService.emit("quality:fetchtable", {});
    //     const sub = this.socketService.listen('listen:Quality_Control').subscribe((res: any) => {

    //         this.updateInfoPanels();
    //         callback(res.data);
    //         // (res.data);
    //         // console.log(res.data);
    //     }, (error: any) => {
    //         console.error('Error fetching table data:', error);
    //     });

    //     this.subscriptions.push(sub);
    // }
    getallQuality_Control() {
        this.socketService.emit("quality:fetchtable", {});
    }

    private countVendor(): number {
        return this.vendorList.filter(item => item.id).length;
    }

    private countApproved(): number {
        return this.Fulldata.filter(item => item.ApprvlSts_name == "Approved").length;
    }
    private countRejected(): number {
        return this.Fulldata.filter(item => item.ApprvlSts_name == "Rejected").length;
    }
    private countPending(): number {
        return this.Fulldata.filter(item => item.approval_status_id == "1").length;
    }
    private countPayStatus(): number {
        return this.Fulldata.filter(item => item.mps_name == "Pending").length;
    }
    private updateInfoPanels(): void {
        const totalEntries = this.Fulldata.length;
        const totalVendor = this.countVendor();
        const totalApprovedBy = this.countApproved();
        const totalPayStatus = this.countPayStatus();
        const totalRejected = this.countRejected();
        const totalPending = this.countPending();


        this.infoPanels = [
            { name: 'Total Entries', value: totalEntries, icon: 'fa fa-table', color: '#ff5900', format: 'number' },
            { name: 'Total Vendor', value: totalVendor, icon: 'fa fa-user-circle-o', color: '#606060', format: 'number' },
            { name: 'Total Approved Approvals', value: totalApprovedBy, icon: 'fa fa-check-circle', color: '#378D3B', format: 'number' },
            { name: 'Total Pending Approvals', value: totalPending, icon: 'fa fa-exclamation-triangle', color: '#0096A6', format: 'number' },
            { name: 'Total Rejected Approvals', value: totalRejected, icon: 'fa fa-ban', color: '#D22E2E', format: 'number' },
            { name: 'Total Payment Status(Pending)', value: totalPayStatus, icon: 'fa fa-paypal', color: '#0096A6', format: 'number' },

        ];
    }

    loadData() {
        this.loadingIndicator = true;
        this.subscribeToWebSocketError();
        // this.loadProducts();
        this.loadUnits();
        this.loadDepartments();
        this.loadVendors();
        this.getallQuality_Control();
        // this.loadPackingSize();
        this.createProductListner();
    }

    private subscribeToWebSocketError() {
        const sub = this.socketService.listen("error").subscribe((error: any) => {

            this.toastr.error(error.message);
            if (error.error === 402) {
                this.socketService.Logout();
            }
        });
        this.subscriptions.push(sub);
    }

    // loadProducts() {
    //     this.socketService.emit("products:all", {});
    // }

    loadUnits() {
        this.socketService.emit("ms-unit:all", {});
    }

    // loadPackingSize() {
    //     this.socketService.emit("ms-packing-size:all", {});
    // }

    loadDepartments() {
        this.socketService.emit("department:all", {});
    }
    loadVendors() {
        const roleId = 5;
        this.socketService.emit("vendor:all", { role_id: roleId });


    }
    // Modified departmentHead method
    departmentHead(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const departmentId = Number(target.value);

        if (!isNaN(departmentId) && departmentId !== 0) {
            // Emit WebSocket event with departmentId for department heads
            this.socketService.emit("department:head", {
                department_id: departmentId,
                role_id: [11, 3]
            });

            // Special handling for Silo department (ID: 4)
            // if (departmentId === 4) {
            //     // Set fixed values for Silo department


            //     // Filter product type list to show only Raw Products
            //     this.productTypeList = this.fullProductTypeList.filter(pt => pt.id === 1);

            //     // Filter products list to show only Raw Milk
            //     this.namesList = this.fullNamesList.filter(p => p.id === 27);

            //     // Instead of disabling controls, make them readonly
            //     const productTypeControl = this.blockForm.get('productTypeId');
            //     const productControl = this.blockForm.get('productId');

            //     if (productTypeControl && productControl) {
            //         // Set as readonly using a custom attribute
            //         productTypeControl.markAsTouched();
            //         productControl.markAsTouched();
            //     }
            // } else {
            //     // For other departments, restore normal operation
            //     this.productTypeList = [...this.fullProductTypeList];
            //     this.namesList = [...this.fullNamesList];

            //     const productTypeControl = this.blockForm.get('productTypeId');
            //     const productControl = this.blockForm.get('productId');

            //     // if (productTypeControl && productControl) {
            //     //     // Reset values but keep the controls enabled
            //     //     this.blockForm.patchValue({
            //     //         productTypeId: 0,
            //     //         productId: 0
            //     //     });
            //     // }
            // }
        } else {
            // Reset lists when no department is selected
            this.departmentheadList = [];
            this.productTypeList = [...this.fullProductTypeList];
            this.namesList = [];

            // Reset form controls
            this.blockForm.patchValue({
                productTypeId: 0,
                productId: 0
            });
        }
    }



    productbyproductType(InputData: Event | any) {
        let productTypeId: number;
        if (typeof InputData === "number") {
            productTypeId = InputData;
        } else {
            const target = InputData.target as HTMLSelectElement;
            productTypeId = Number(target.value);
        }

        console.log("Selected Product Type ID:", productTypeId);
        console.log("Selected Vendor ID:", this.selectedVendor);

        // Only emit if both IDs are valid
        if (!isNaN(productTypeId) && productTypeId > 0 && this.selectedVendor > 0) {
            this.socketService.emit("ms-vender-product:products-by-vendor", {
                id: this.selectedVendor,
                ms_product_type_id: productTypeId
            });
        } else {
            this.namesList = [];
        }
    }


    // packinggsizebyPrdct(event: Event) {
    //     const target = event.target as HTMLSelectElement;
    //     const productId = Number(target.value);

    //     // Create the payload object
    //     const payload = {
    //         product_id: productId || null  // Use null instead of undefined if no value
    //     };

    //     // Only emit if we have a valid product type ID
    //     if (!isNaN(productId) && productId > 0) {
    //         // console.log('Emitting with payload:', payload);  // Debug log
    //         this.socketService.emit("ms-packing-size:by-product-id", payload);
    //     } else {
    //         console.warn('Invalid product type ID:', productId);  // Debug log
    //         this.packingList = [];
    //     }
    // }
    packinggsizebyPrdct(newInput: Event | any) {
        // // console.log('Emitting with payload:', newInput.target.value); // Debug log
        let productId: number
        if (typeof newInput === "number") {
            productId = newInput
        } else {
            const target = newInput.target as HTMLSelectElement
            productId = Number(target.value)
        }
        if (!isNaN(productId) && productId !== 0) {
            this.socketService.emit("ms-packing-size:by-product-id", { productId: productId });
        } else {
            this.packingList = [];
            // // console.log("data", this.packingList)
        }


    }

    closeForm() {
        this.blockForm.reset();
        this.isEditMode = false;
        this.editUserId = 0;
        this.closeButton?.nativeElement?.click();
    }

    editProduct(id: number): void {
        this.isEditMode = true;
        this.editUserId = id;
        this.socketService.emit('quality:get-vendor-by-id', { id });

    }
    // save user details to database
    updateDetails() {
        if (this.blockForm.valid) {
            const data = { ...this.blockForm.value, billImage: this.defaultPic, id: this.editUserId };
            // ("update form data =>", data);
            this.socketService.emit("quality:update", data);
        }
    }


    deleteProduct(id: any): void {
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
                this.socketService.emit('quality:delete-vendor-by-id', { id });

                // Listen for the response from the server

            }
        });
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Vendor', 'Product', 'Product Type', 'Packaging Size', 'Quantity', ' Rejected Quantity', 'Price (Per Unit)', 'Department', 'Department Head', 'Approved By', 'Created On', 'Approved Status', 'Payment Status', 'Payment Appr. By'];
        csvData.push(headers.join(','));
        this.Fulldata.forEach((row, index) => {
            const rowData = [
                index + 1,  // Sr. No
                row.full_name,
                row.product_name,
                row.product_type_name,
                `${row.packing_size} ${row.st_name}`,
                `${row.quantity} ${row.UntName}`,
                `${row.rejected_quantity} ${row.UntName}`,
                `${row.priceper_unit} ${row.UntName}`,
                row.DprtName,
                row.DprtHeadFullName,
                row.ApprvlbyFullName,
                new Date(row.created_on).toLocaleDateString(),  // Formatted date
                row.ApprvlSts_name,
                row.mps_name,
                row.pstsby_name
            ];
            csvData.push(rowData.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link)

            ;
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();

        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            return (
                // Basic information
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                (item.created_on?.toLowerCase().includes(val)) ||
                (item.full_name?.toLowerCase().includes(val)) ||

                // Product related
                (item.product_name?.toLowerCase().includes(val)) ||
                (item.product_type_name?.toLowerCase().includes(val)) ||
                (item.packing_size?.toString().toLowerCase().includes(val)) ||
                (item.st_name?.toLowerCase().includes(val)) ||

                // Quantity and Price
                (item.quantity?.toString().toLowerCase().includes(val)) ||
                (item.unit_name?.toLowerCase().includes(val)) ||
                (item.priceper_unit?.toString().toLowerCase().includes(val)) ||

                // Department related
                (item.DprtName?.toLowerCase().includes(val)) ||
                (item.DprtHeadFullName?.toLowerCase().includes(val)) ||

                // Approval related
                (item.ApprvlbyFullName?.toLowerCase().includes(val)) ||
                (item.ApprvlSts_name?.toLowerCase().includes(val)) ||

                // Payment related
                (item.mps_name?.toLowerCase().includes(val)) ||
                (item.pstsby_name?.toLowerCase().includes(val))
            );
        });

        // update the rows
        this.Fulldata = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
    onSubmit() {
        // this.blockForm.patchValue({

        // });
        if (this.blockForm.valid) {
            const formData = { ...this.blockForm.value, billImage: this.defaultPic }
            if (this.blockForm.value.departmentId == 4) {
                this.socketService.emit('vendor:entrygoods', { ...formData, productTypeId: 1, productId: 27 });
                return
            }
            this.socketService.emit('vendor:entrygoods', formData);

            ;
        } else {
            this.toastr.warning('Please fill all required fields.');
            Object.keys(this.blockForm.controls).forEach(key => {
                const control = this.blockForm.get(key);
                control?.markAsTouched();
            });
        }
    }

    previewImage(event: Event) {
        const fileInput = event.target as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && e.target.result) {
                    this.previewImageUrl = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    }
    createProductListner() {
        this.socketService.listen('products:create').subscribe((res: any) => {
            // // console.log("products:create =>", res)
            if (res.success) {
                this.toastr.success(res.message);
                this.productForm.reset({
                    unitId: 0,
                    productType: 0,
                    productImage: 0,
                    roughProductId: 0,
                    status: 1,
                    freshPrice: 1,
                    packedPrice: 1,
                });
                return;

            }
            this.toastr.error(res.message);

        });
    }
    createProduct() {
        // debugger
        // // console.log("create product hitted =>")
        // // console.log(this.productForm.errors)
        console.table(this.productForm.value)
        const formData = this.productForm.value;
        if (this.productForm.valid) {
            this.socketService.emit("products:create", formData);
        }
    }


    addProduct() {
        if (this.productForm.valid) {
            // Emit the product data to the WebSocket server
            this.socketService.emit("product:insert", this.productForm.value);
            // Subscribe to the response from the server

        } else {
            // Notify the user if the form is invalid
            this.toastr.error('Please fill out the form correctly.');
        }
    }

    async uploadFile(file: any) {

        // // console.log("local file details =>", file[0])
        this.isFileUploading = true;

        this.uploadResult = await this.utilityServices.uploadImageUtility(file);
        // ("uploadResult =>", this.uploadResult);

        if (this.uploadResult.error) {
            Swal.fire("Something went wrong", "Unable to upload file!", 'warning');
            this.isFileUploading = false;
        } else {
            // Update the form control with the file name
            this.blockForm.patchValue({
                bill_image: this.uploadResult?.Filename ?? ""
            });

            // Assign the uploaded file name to the defaultPic variable
            this.defaultPic = this.uploadResult.Filename;

            // Reset the file uploading state
            this.isFileUploading = false;
        }
    }


    async uploadPrdctImg(file: any) {
        this.isFileUploading = true;
        this.uploadResult = await this.utilityServices.uploadImageUtility(file);
        // ("uploadResult =>", this.uploadResult)
        if (this.uploadResult.error) {
            Swal.fire("something went wrong", "unable to upload file !", 'warning');
            this.isFileUploading = false;
        }
        else {
            this.productForm.patchValue({
                product_image: this.uploadResult?.Filename ?? "",
            })
        }
    }

    viewProduct(id: any) {
        this.router.navigate([`/pages/view-quality-control/` + id]);
    }

    openInvoice(Vru_id: any) {
        this.router.navigate([`/pages/Invoice/` + Vru_id]);
    }
    printFile() {
        const headers = ['Sr. No', 'Vendor', 'Product', 'Product Type', 'Packaging Size', 'Quantity', ' Rejected Quantity', 'Price (Per Unit)', 'Department', 'Department Head', 'Approved By', 'Created On', 'Approved Status', 'Payment Status', 'Payment Appr. By'];
        this.printService.print(headers, this.Fulldata, (row, index) => [
            (index + 1).toString(),
            row.full_name,
            row.product_name,
            row.product_type_name,
            `${row.packing_size} ${row.st_name}`,
            `${row.quantity} ${row.UntName}`,
            `${row.rejected_quantity} ${row.UntName}`,
            `${row.priceper_unit} ${row.UntName}`,
            row.DprtName,
            row.DprtHeadFullName,
            row.ApprvlbyFullName,
            new Date(row.created_on).toLocaleDateString(),  // Formatted date
            row.ApprvlSts_name,
            row.mps_name,
            row.pstsby_name
        ]);
    }
    openImagePreview(imageUrl: string): void {
        this.selectedPreviewImage = imageUrl;
        $('#imagePreviewModal').modal('show');
    }

    productTypebyvendor(InputData: Event | any) {
        let vendorId: number
        if (typeof InputData === "number") {
            vendorId = InputData
        } else {
            const target = InputData.target as HTMLSelectElement
            vendorId = Number(target.value)
        }

        // Only emit if we have a valid product type ID
        if (!isNaN(vendorId) && vendorId > 0) {
            // // console.log('Emitting with payload:', payload);  // Debug log
            this.selectedVendor = vendorId;
            this.socketService.emit("ms-vender-product:product-types", { id: vendorId });
        } else {
            // console.warn('Invalid product type ID:', productTypeId);  // Debug log
            this.productTypeList = [];
        }

    }

    getpriceListen() {
        this.socketService.listen("ms-vender-product:product-price").subscribe((res: any) => {
            if (res.success) {
                const data = res.data
                // // console.log("priceData", data);

                this.blockForm.patchValue({
                    pricePerUnit: data.price
                })
            } else {
                this.toaster.error(res.message)
            }
        })
    }
    // get price according to vendor id, product id, packingsize id,product type id 
    getPrice(packingSize: Event | any) {
        let packingSizeId: number

        if (packingSize === "number") {
            packingSizeId = packingSize
        } else {
            const target = packingSize.target as HTMLSelectElement;
            packingSizeId = Number(target.value)
        }
        if (!isNaN(packingSizeId) && packingSizeId > 0) {
            // // console.log('Emitting with payload:', payload);  // Debug log
            this.selectedVendor = packingSizeId;
            const formData = this.blockForm.value
            const data = {
                vendorId: formData.vendorId,
                productTypeId: formData.productTypeId,
                productId: formData.productId,
            };
            // const data = formData.vendorId,formData.productTypeId,formData.productId
            this.socketService.emit("ms-vender-product:product-price", { ...data, packingSizeId });
        } else {
            // console.warn('Invalid product type ID:', productTypeId);  // Debug log
            this.productTypeList = [];
        }
    }
    // printFile() {
    //   this.printService.printTable(this.table, 'Quality Control Data');
    // }
}