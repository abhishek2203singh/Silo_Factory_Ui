import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../../theme/directives/directives.module';
import { SocketService } from '@services/Socket.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { UtilityService } from '@services/utility.service';

@Component({
    selector: 'app-edit-silos-department',
    standalone: true,
    imports: [NgxChartsModule, DirectivesModule, NgxDatatableModule, FormsModule, ReactiveFormsModule],
    templateUrl: './edit-silos-department.component.html',
    styleUrls: ['./edit-silos-department.component.scss']
})
export class EditSilosDepartmentComponent implements OnInit, OnDestroy {
    sd_id: any;
    entryType: number;
    rows: any[] = [];
    isEditable: boolean[] = [];
    isSubmitDisabled: boolean = true;
    silosdata: any[] = [];
    siloDForm: FormGroup;
    silDId: number = 0;
    data: any
    private socketService = inject(SocketService);
    totalQuantity: number = 0;
    remainingQuantity: number = 0;

    public colorScheme: any = {
        domain: ['#F47B00', '#E0E0E0']
    };

    public customColors = [
        { name: 'Available', value: '#F47B00' },
        { name: 'Empty', value: '#E0E0E0' }
    ];

    tempEntries: any[] = [];
    totalRemainingQuantity: number = 0;
    private subscriptions: Subscription[] = [];

    constructor(
        public activatedRoute: ActivatedRoute,
        private fb: FormBuilder,
        private router: Router,
        public toastr: ToastrService,
        protected util: UtilityService
    ) {
        this.sd_id = this.activatedRoute.snapshot.paramMap.get("id");
    }

    ngOnInit(): void {
        this.siloDForm = this.fb.group({
            qty: [{ value: '', disabled: true }]
        });

        this.getAllSilosAtChart();
        this.getAllData();
        this.editSilo(this.sd_id);
        this.editSiloDListen();
        this.listenForSilosAdd();
    }

    goBack() {
        this.router.navigate(['/pages/Silo-Department']);
    }

    editSiloDListen() {
        const sub = this.socketService.listen("silos-dpt:get-data-by-id").subscribe((res: any) => {
            this.data = res.data;
            const { qty, QtysiloBox, EntryId } = this.data;
            // console.log("entry details =>", this.data)
            this.entryType = EntryId
            // ("shkdfdfg", data)
            this.totalQuantity = qty - QtysiloBox;
            // ("total qty =>", this.totalQuantity);
            // this.updateRemainingQuantity();
            this.siloDForm.patchValue({ qty: this.totalQuantity });
        });
        this.subscriptions.push(sub);
    }

    updateRemainingQuantity() {
        const distributedQuantity = this.tempEntries.reduce((sum, entry) => sum + entry.milkQty, 0);
        this.remainingQuantity = this.totalQuantity - distributedQuantity;
        this.siloDForm.patchValue({ qty: this.remainingQuantity });
    }

    onPlusClick(item: any) {
        // Check if the silo is not completely full
        if (item.extra.percentage < 100) {
            item.showForm = true;
            item.formAction = 'add';
            item.tempQuantity = 0;
            item.trnsType = 'in';
            item.EntryId = 3;
        }
    }

    onMinusClick(item: any) {
        // Check if the silo is not completely empty
        if (item.extra.percentage > 0) {
            item.showForm = true;
            item.formAction = 'subtract';
            item.tempQuantity = 0;
            item.trnsType = 'out';
            item.EntryId = 1;
        }
    }

    cancelForm(item: any) {
        item.showForm = false;
        item.tempQuantity = 0;
    }

    onSubmit(item: any) {
        const quantity = parseFloat(item.tempQuantity);

        // Validation for quantity input
        if (isNaN(quantity) || quantity <= 0) {
            this.toastr.warning('Please enter a valid quantity.');
            return;
        }

        // Additional validation to prevent overfilling or over-emptying
        if (item.formAction === 'add') {
            const potentialNewPercentage = ((item.availableMilk + quantity) / item.totalcapacity) * 100;
            if (potentialNewPercentage > 100) {
                this.toastr.warning(`Cannot add more than silo capacity. Maximum allowed: ${(item.totalcapacity - item.availableMilk).toFixed(2)} L`);
                return;
            }
        } else if (item.formAction === 'subtract') {
            const potentialNewPercentage = ((item.availableMilk - quantity) / item.totalcapacity) * 100;
            if (potentialNewPercentage < 0) {
                this.toastr.warning(`Cannot subtract more than available quantity. Maximum allowed: ${item.availableMilk.toFixed(2)} L`);
                return;
            }
        }

        // Perform quantity addition or subtraction
        if (item.formAction === 'add') {
            this.addQuantity(item, quantity);
        } else {
            this.subtractQuantity(item, quantity);
        }

        // Push entry to temporary entries
        this.tempEntries.push({
            siloName: item.name,
            siloId: item.id,
            milkQty: quantity,
            trnsType: item.trnsType,
            remaining: Number(item.totalcapacity - item.availableMilk),
            milkStatus: 'fresh',
        });

        // Update table rows and remaining quantity
        this.updateTableRows();
        this.updateRemainingQuantity();

        // Reset form
        item.showForm = false;
        item.tempQuantity = 0;
    }

    addQuantity(item: any, quantity: number) {
        const newAvailableMilk = Number(item.availableMilk + quantity);
        if (newAvailableMilk <= item.totalcapacity) {
            item.availableMilk = newAvailableMilk;
            this.updateSeriesAndPercentage(item);
        } else {
        }
    }

    subtractQuantity(item: any, quantity: number) {
        const newAvailableMilk = item.availableMilk - quantity;
        if (newAvailableMilk >= 0) {
            item.availableMilk = newAvailableMilk;
            this.updateSeriesAndPercentage(item);
        } else {
        }
    }

    updateSeriesAndPercentage(item: any) {
        item.series[0].value = item.availableMilk;
        item.series[1].value = (item.totalcapacity - item.availableMilk);
        item.extra.percentage = (item.availableMilk / item.totalcapacity) * 100;
    }

    getAllData() {
        const sub = this.socketService.listen('ms-silos:all').subscribe((res: any) => {
            if (res?.success) {
                // console.log("silos data =>", res.data)
                this.silosdata = this.transformData(res.data);
            }
        });
        this.subscriptions.push(sub);
    }

    getAllSilosAtChart() {
        this.socketService.emit('ms-silos:all', {});
    }

    toggleForm(item: any, action: 'add' | 'subtract') {
        item.showForm = true;
        item.tempQuantity = 0;
        item.action = action;
    }

    transformData(data: any[]): any[] {
        return data.map(item => {
            // console.log("inside transform =>", item)
            const availableMilk = parseFloat(item.total_available_milk);
            const totalCapacity = parseFloat(item.capacity);
            const percentage = (availableMilk / totalCapacity) * 100;
            return {
                id: item.id,
                name: item.silo_name,
                totalcapacity: totalCapacity,
                availableMilk: availableMilk,
                empty_space: item.empty_space,
                status: item.status,//added by pankaj
                extra: {
                    percentage: percentage
                },
                series: [
                    {
                        name: 'Available',
                        value: availableMilk
                    },
                    {
                        name: 'Empty',
                        value: totalCapacity - availableMilk
                    }
                ],
                showForm: false,
                formAction: '',
                tempQuantity: 0
            };
        });
    }

    editSilo(sd_id: number): void {
        this.silDId = sd_id;
        this.socketService.emit('silos-dpt:get-data-by-id', { silDId: sd_id });
    }

    updateTableRows() {
        this.rows = [...this.tempEntries];
        this.isEditable = Array(this.rows.length).fill(false);

        this.totalRemainingQuantity = this.tempEntries.reduce((sum, entry) => sum + entry.remaining, 0);

        // Update the disabled state of the submit button
        this.isSubmitDisabled = this.tempEntries.length === 0;
    }

    finalSubmit() {
        Swal.fire({
            title: 'Are you sure?',
            text: `You won't be able to revert this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, submit it!'
        }).then((result) => {
            if (result.isConfirmed) {
                if (this.areAllRowsValid()) {
                    const payload = {
                        sourceId: this.sd_id,
                        entries: this.tempEntries.map(row => ({
                            siloId: row.siloId,
                            milkQty: row.milkQty,
                            milkStatus: row.milkStatus,
                            trnsType: row.trnsType
                        }))
                    };
                    this.socketService.emit('silos:add', payload);
                } else {
                    this.toastr.warning('Please fill all required fields.');
                }
            } else {
                this.toastr.info('Submission canceled.');
            }
        });
    }

    // finalSubmit() {
    //   if (this.areAllRowsValid()) {
    //     const payload = {
    //       sourceId: this.sd_id,
    //       entries: this.tempEntries.map(row => ({
    //         siloId: row.siloId,
    //         milkQty: row.milkQty,
    //         milkStatus: row.milkStatus,
    //         trnsType: row.trnsType  // Use the stored transaction type
    //       }))
    //     };
    //     this.socketService.emit('silos:add', payload);
    //   } else {
    //     this.toastr.warning('Please fill all required fields.');
    //   }
    // }
    private areAllRowsValid(): boolean {
        return this.tempEntries.every(row =>
            row.siloId &&
            row.milkQty !== undefined &&
            row.milkQty !== null &&
            row.milkStatus
        );
    }

    editRow(rowIndex: number): void {
        this.isEditable[rowIndex] = true;
        this.tempEntries[rowIndex].originalQuantity = this.tempEntries[rowIndex].milkQty;
    }

    saveRow(row: any, rowIndex: number): void {
        // ('Row data saved:', row);
        const originalQuantity = this.tempEntries[rowIndex].originalQuantity || 0;
        const quantityDifference = row.milkQty - originalQuantity;

        row.remaining -= quantityDifference;

        this.isEditable[rowIndex] = false;

        this.tempEntries[rowIndex] = { ...row };

        this.updateTableRows();
        this.updateRemainingQuantity();

        this.updateGraph(row.siloName, quantityDifference);
    }

    updateGraph(siloName: string, quantityDifference: number) {
        const siloToUpdate = this.silosdata.find(silo => silo.name === siloName);
        if (siloToUpdate) {
            siloToUpdate.availableMilk += quantityDifference;
            this.updateSeriesAndPercentage(siloToUpdate);
        }
    }

    listenForSilosAdd() {
        const sub = this.socketService.listen('silos:add').subscribe((response: any) => {
            if (response.success) {
                this.toastr.success(response.message);

                // Reset the component state
                this.tempEntries = [];
                this.updateTableRows();
                this.getAllSilosAtChart(); // Refresh silo data

                // Reset form if needed (adjust according to your needs)
                this.siloDForm.reset();
                this.updateRemainingQuantity();
            } else {
                this.toastr.error(response.message);
            }
        });
        this.subscriptions.push(sub);
    }

    ngOnDestroy() {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}