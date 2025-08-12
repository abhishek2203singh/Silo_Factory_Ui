import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { ImasterApprovals } from '../../../../Models/masterApproval';
import { ImasterEntryType } from '../../../../Models/masterEntryType';
import { Iproduct } from '../../../../Models/product';
import { Iunit } from '../../../../Models/unit';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDepartment } from '../../../../Models/dipartment';
import { IUserProfile } from '../../../../Models/departmentHead';
import { DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { InfoPanelsComponent, InfoPanelData } from '../../../dashboard/info-panels/info-panels.component';
import { PrintService } from '@services/print.service';
import { UtilityService } from '@services/utility.service';
import Swal from 'sweetalert2';
import { BaseService } from '@services/Base.service';
import { IproductType } from '../../../../Models/productType.model';
@Component({
    selector: 'app-products',
    standalone: true,
    imports: [InfoPanelsComponent, CommonModule, ReactiveFormsModule, NgxDatatableModule],
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
    productForm: FormGroup;
    productData: Iproduct[];
    productInfo: Iproduct;
    productTypeList: IproductType[]
    uploadResult: any;
    defaultPic: any;
    unitData: Iunit[];
    tableLength: any;
    editId: any;
    editData: any;
    resdata: any;
    isFileUploading: boolean = false
    infoPanels: InfoPanelData[] = [];
    isAccordionExpanded: boolean = false;
    baseImgUrl: string;
    temp: any[] = [];
    mrp: number;
    private socketService = inject(SocketService);
    public toastr = inject(ToastrService);
    public fb = inject(FormBuilder);
    @ViewChild(DatatableComponent) table: DatatableComponent;
    constructor(private baseService: BaseService, private printService: PrintService, private utilityServices: UtilityService, private datePipe: DatePipe) {
        this.baseImgUrl = this.baseService.imageurl;
        this.productForm = this.fb.group({
            productName: ['', Validators.required],
            isGstIncluded: [1, Validators.required],
            unitId: [0, Validators.required],
            productType: [0, Validators.required],
            productImage: [''],
            roughProductId: [0, Validators.required],
            status: [1, Validators.required],
            mrp: ['', Validators.required],
            basePrice: ['', Validators.required],
            cgst: [],
            sgst: [],
            deliveryCharges: [0, Validators.required],
        });
    }
    ngOnInit(): void {
        const sub = this.socketService.listen("error").subscribe((vendor: any) => {
            this.toastr.error(vendor.message);
        });
        this.getProductListen();
        this.getProduct();
        this.getUnitListen();
        this.getUnit();
        this.createProductListner();
        this.updateProductListen();
        this.getProductByIdListen();
        this.getProductTypesListen();
        this.getProductTypes();
        this.initializeForm();
        this.listenToProductData();
    }
    initializeForm() {
        this.productForm = this.fb.group({
            productName: ['', Validators.required],
            isGstIncluded: [1, Validators.required],
            unitId: [0, Validators.required],
            productType: [0, Validators.required],
            productImage: [''],
            roughProductId: [0, Validators.required],
            status: [1, Validators.required],
            mrp: [0, Validators.required],
            basePrice: [0, Validators.required],
            cgst: [0],
            sgst: [0],
            deliveryCharges: [0, Validators.required],
        });
    }
    calculateMrp(basePrice: any, cgst: any, sgst: any = 0) {
        const base = Number(basePrice);
        const cgstValue = this.parcentageValue(base, cgst);
        const sgstValue = this.parcentageValue(base, sgst);
        const mrp = base + cgstValue + sgstValue;
        // // console.log({
        //     base,
        //     cgstValue,
        //     sgstValue,
        //     mrp
        // })
        this.productForm.patchValue({
            mrp: mrp
        })
    }
    parcentageValue(baseValue: any, percentage: any) {
        let base = Number(baseValue);
        let percent = Number(percentage);
        if (!percentage) {
            // // console.log({ percent, baseValue })
            return 0
        }
        // // console.log({ percent, baseValue, mrp: (base * percent) / 100 })
        return (base * percent) / 100;
    }
    getProductListen() {
        this.socketService.listen('products:all').subscribe((res: any) => {
            if (res.success) {
                this.productData = res.data;
                this.temp = [...this.productData];
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    getProductTypesListen() {
        this.socketService.listen('ms-product-type:all').subscribe((res: any) => {
            if (res.success) {
                this.productTypeList = res.data;
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    getProduct() {
        this.socketService.emit("products:all", {});
    }
    getUnitListen() {
        this.socketService.listen('ms-unit:all').subscribe((res: any) => {
            if (res.success) {
                this.unitData = res.data;
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    getUnit() {
        this.socketService.emit("ms-unit:all", {});
    }
    getProductTypes() {
        this.socketService.emit("ms-product-type:all", {});
    }
    createProductListner() {
        this.socketService.listen('products:create').subscribe((res: any) => {
            if (res.success) {
                this.toastr.success(res.message);
                this.resetForm();
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    createProduct() {
        const formData = this.productForm.value;
        if (this.productForm.valid) {
            this.socketService.emit("products:create", formData);
        }
    }
    getId(productId: number) {
        this.editId = productId;
        this.socketService.emit('products:by-id', { id: productId });
    }
    exportToCSV() {
        const csvData = [];
        const headers = ['Sr. No', 'Product Name', 'Unit', 'Raw Product', 'Base Price', 'CGST', 'SGST', 'MRP', 'Delivery Charges', 'Entry Date'];
        csvData.push(headers.join(','));
        this.productData.forEach((row, index) => {
            // // console.log("rowcsv ", row);
            const rowData = [
                index + 1,  // Sr. No
                row.product_name,
                row.unit_name,
                row.rough_product_name,
                `${row.base_price}`,
                row.cgst,
                row.sgst,
                row.delivery_charges,
                // row.is_gst_included,,
                `${row.mrp}`,
                this.datePipe.transform(row.created_on, 'MMM d, y') || 'N/A'  // Safely handle date formatting
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
    updateProductListen() {
        this.socketService.listen('products:update').subscribe((res: any) => {
            if (res.success) {
                this.resdata = res.data;
                this.toastr.success(res.message);
                this.resetForm();
                this.closeCollapse();
                // Refresh the list
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    listenToProductData() {
        this.socketService.listen('products:by-id').subscribe((res: any) => {
            if (res.success) {
                // console.log("Product", res)
                this.productForm.patchValue({
                    productName: res.data.product_name,
                    productType: res.data.ms_product_type_id,
                    unitId: res.data.uom,
                    basePrice: res.data.base_price,
                    mrp: res.data.mrp,
                    cgst: res.data.cgst,
                    isGstIncluded: res.data.is_gst_included,
                    sgst: res.data.sgst,
                    roughProductId: res.data.rough_product_id,
                    status: res.data.status,
                    deliveryCharges: res.data.delivery_charges,
                    productImage: res.data.product_image // Add this line
                });
                // Set the default picture if an image exists
                this.defaultPic = res.data.product_image || '';
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    updateMrp() {
        const basePrice = this.productForm.get('basePrice')?.value || 0;
        const cgst = this.productForm.get('cgst')?.value || 0;
        const sgst = this.productForm.get('sgst')?.value || 0;
        this.productForm.patchValue({
            mrp: basePrice + (basePrice * (cgst + sgst)) / 100,
        });
    }
    // uploadFile(event: any) {
    //     const file = event.target.files[0];
    //     if (file) {
    //         this.productForm.patchValue({ productImage: file });
    //     }
    // }
    getProductByIdListen() {
        this.socketService.listen('products:by-id').subscribe((res: any) => {
            if (res.success) {
                // // console.log("patch data =>", res.data)
                this.productInfo = res.data;
                this.productForm.patchValue({
                    productName: this.productInfo.product_name,
                    roughProductId: this.productInfo?.rough_product_id,
                    productType: this.productInfo?.ms_product_type_id,
                    productImage: this.productInfo?.product_image,
                    status: this.productInfo.status,
                    cgst: Number(this.productInfo.cgst) || 0,
                    sgst: Number(this.productInfo.sgst) || 0,
                    isGstIncluded: this.productInfo.is_gst_included ? 1 : 0,
                    basePrice: Number(this.productInfo.base_price) || 0,
                    mrp: Number(this.productInfo.mrp) || 0,
                    unitId: this.productInfo.uom,
                    deliveryCharges: Number(this.productInfo.delivery_charges) || 0,
                });
                // to the top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                this.toastr.error(res.message);
            }
        });
    }
    updateProduct() {
        const data = { ...this.productForm.value };
        this.socketService.emit('products:update', { ...data, id: this.editId });
    }
    resetForm() {
        this.productForm.reset(
            {
                productName: "",
                productImage: "",
                isGstIncluded: 1,
                unitId: 0,
                productType: 0,
                roughProductId: 0,
                status: 1,
            });
        this.editId = 0; // Clear the department head list
    }
    closeCollapse() {
        const collapseElement = document.getElementById('collapseOne');
        if (collapseElement) {
            const bootstrapCollapse = new (window as any).bootstrap.Collapse(collapseElement, {
                toggle: false
            });
            bootstrapCollapse.hide();
            this.isAccordionExpanded = false;
        }
        this.resetForm();
    }
    // to toggle according => close /open
    toggleAccordion() {
        const collapseElement = document.getElementById('collapseOne');
        if (collapseElement) {
            const bootstrapCollapse = new (window as any).bootstrap.Collapse(collapseElement, {
                toggle: false
            });
            if (collapseElement.classList.contains('show')) {
                bootstrapCollapse.hide();
                this.isAccordionExpanded = false;
            } else {
                bootstrapCollapse.show();
                this.isAccordionExpanded = true;
            }
        }
    }
    async uploadFile(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.isFileUploading = true;
            this.uploadResult = await this.utilityServices.uploadImageUtility(file);
            if (this.uploadResult.error) {
                Swal.fire("Something went wrong", "Unable to upload file!", 'warning');
                this.isFileUploading = false;
            } else {
                // Update the form control with the file name
                this.productForm.patchValue({
                    productImage: this.uploadResult?.Filename ?? ""
                });
                // Reset file input
                event.target.value = '';
                // Update defaultPic for display
                this.defaultPic = this.uploadResult.Filename;
                this.isFileUploading = false;
            }
        }
    }
    printFile() {
        const headers = ['Sr. No', 'Product Name', 'Unit', 'Raw Product', 'Base Price', 'CGST', 'SGST', 'MRP', 'Delivery Charges', 'Entry Date'];
        this.printService.print(headers, this.productData, (row, index) => [
            (index + 1).toString(),
            row.product_name || '',  // Handle null or undefined values
            row.unit_name || '',
            row.rough_product_name || '',
            `₹${row.base_price}`,
            row.cgst,
            row.sgst,
            `₹${row.mrp}`,
            row.delivery_charges,
            this.datePipe.transform(row.created_on, 'MMM d, y') || 'N/A'   // Safely handle date formatting
        ]);
    }
    updateFilter(event: any) {
        const val = event.target.value.toLowerCase();
        // filter our data
        const filteredData = this.temp.filter((item: any) => {
            // Convert numeric status to string (Active/Deactive) for filtering
            const statusText = item.status === 1 ? 'active' : 'deactive';
            return (
                (item.product_name?.toLowerCase().includes(val)) ||
                (item.unit_name?.toLowerCase().includes(val)) ||
                (item.product_type_name?.toLowerCase().includes(val)) ||
                (item.rough_product_name?.toLowerCase().includes(val)) ||
                (item.fresh_price?.toString().toLowerCase().includes(val)) ||
                (item.packed_price?.toString().toLowerCase().includes(val)) ||
                (item.mrp?.toString().toLowerCase().includes(val)) ||
                (item.base_price?.toString().toLowerCase().includes(val)) ||
                (this.datePipe.transform(item.created_on, 'MMM dd yyyy')?.toLowerCase().includes(val)) ||
                statusText.includes(val) ||
                !val
            );
        });
        // update the rows
        this.productData = filteredData;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
    }
}

