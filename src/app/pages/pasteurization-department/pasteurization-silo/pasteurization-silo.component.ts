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
    selector: 'app-pasteurization-silo',
    standalone: true,
    imports: [NgxChartsModule, DirectivesModule, NgxDatatableModule, FormsModule, ReactiveFormsModule],
    templateUrl: './pasteurization-silo.component.html',
    styleUrl: './pasteurization-silo.component.scss'
})
export class PasteurizationSiloComponent {
    sd_id: any;
    rows: any[] = [];
    isEditable: boolean[] = [];
    isSubmitDisabled: boolean = true;
    pasteSilodata: any[] = [];
    entryType: number;
    remainingQuantity: number = 0;
    siloDForm: FormGroup;
    pid: number = 0;
    private socketService = inject(SocketService);

    public colorScheme: any = {
        domain: ['#F47B00', '#E0E0E0']
    };

    public customColors = [
        { name: 'Available', value: '#F47B00' },
        { name: 'Empty', value: '#E0E0E0' }
    ];

    tempEntries: any[] = [];
    totalQuantity: number = 0;
    totalRemainingQuantity: number = 0;
    entryDetails: EntryDetails;
    private subscriptions: Subscription[] = [];

    constructor(
        public activatedRoute: ActivatedRoute,
        private fb: FormBuilder,
        private router: Router,
        public toastr: ToastrService,
        public util: UtilityService,
    ) {
        this.sd_id = this.activatedRoute.snapshot.paramMap.get("id");
    }

    ngOnInit(): void {
        this.siloDForm = this.fb.group({
            qty: [{ value: '', disabled: true }]
        });

        this.getAllPasteSiloAtChart();
        this.getAllData();
        this.listenForSilosAdd();
        this.editPsiloListen();
        this.editPsilo(this.sd_id);
    }

    goBack() {
        this.router.navigate(['/pages/pasteurization']);
    }
    editPsiloListen() {
        const sub = this.socketService.listen("pasteurization-dpt:get-data-by-id").subscribe((res: any) => {
            const data = res.data;
            const { qty, EntryId, QtysiloBox } = data;
            this.entryDetails = data;
            this.entryType = EntryId;
            this.totalQuantity = qty - QtysiloBox;
            this.updateRemainingQuantity();
            this.siloDForm.patchValue({ qty: this.remainingQuantity });

        });
        this.subscriptions.push(sub);
    }
    updateRemainingQuantity() {

        const distributedQuantity = this.tempEntries.reduce((sum, entry) => sum + entry.milkQty, 0);
        this.remainingQuantity = this.totalQuantity - distributedQuantity;
        this.siloDForm.patchValue({ qty: this.remainingQuantity });
    }

    items: any[] = [];
    onPlusClick(item: any) {
        item.showForm = true;
        item.formAction = 'add';
        item.tempQuantity = 0;
        item.trnsType = 'in';
        item.entryTypeId = 3;

    }

    onMinusClick(item: any) {
        item.showForm = true;
        item.formAction = 'subtract';
        item.tempQuantity = 0;
        item.trnsType = 'out';
        item.entryTypeId = 1;
    }

    cancelForm(item: any) {
        item.showForm = false;
        item.tempQuantity = 0;
    }

    onSubmit(item: any) {
        const quantity = parseFloat(item.tempQuantity);

        if (isNaN(quantity) || quantity <= 0) {
            item.tempQuantityTouched = true;
            return;
        }

        if (item.formAction === 'add') {
            this.addQuantity(item, quantity);
        } else {
            this.subtractQuantity(item, quantity);
        }

        const remainingQty = parseFloat(this.siloDForm.get('quantity')?.value) || 0;

        this.tempEntries.push({
            siloName: item.name,
            siloId: item.id,
            milkQty: quantity,
            milkStatus: 'fresh',
            trnsType: item.trnsType,
            remaining: Number(item.totalcapacity - item.availableMilk),

        });

        this.updateTableRows();
        this.updateRemainingQuantity()
        item.showForm = false;
        item.tempQuantity = 0;
    }

    addQuantity(item: any, quantity: number) {
        const newAvailableMilk = Number(item.availableMilk + quantity);
        if (newAvailableMilk <= item.totalcapacity) {
            item.availableMilk = newAvailableMilk;
            this.updateSeriesAndPercentage(item);
        }
    }

    subtractQuantity(item: any, quantity: number) {
        const newAvailableMilk = item.availableMilk - quantity;
        if (newAvailableMilk >= 0) {
            item.availableMilk = newAvailableMilk;
            this.updateSeriesAndPercentage(item);
        }
    }

    updateSeriesAndPercentage(item: any) {
        item.series[0].value = item.availableMilk;
        item.series[1].value = (item.totalcapacity - item.availableMilk);
        item.extra.percentage = (item.availableMilk / item.totalcapacity) * 100;
    }

    getAllData() {
        const sub = this.socketService.listen('ms-ps-silo:all').subscribe((res: any) => {
            if (res?.success) {
                this.pasteSilodata = this.transformData(res.data);
            }
        });
        this.subscriptions.push(sub);
    }

    getAllPasteSiloAtChart() {
        this.socketService.emit('ms-ps-silo:all', {});
    }

    toggleForm(item: any, action: 'add' | 'subtract') {
        item.showForm = true;
        item.tempQuantity = 0;
        item.action = action;
    }

    transformData(data: any[]): any[] {
        return data.map(item => {
            const availableMilk = parseFloat(item.total_available_milk);
            const totalCapacity = parseFloat(item.capacity);
            const percentage = (availableMilk / totalCapacity) * 100;
            return {
                id: item.id,
                name: item.silo_name,
                totalcapacity: totalCapacity,
                availableMilk: availableMilk,
                empty_space: item.empty_space,

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


    updateTableRows() {
        this.rows = [...this.tempEntries];
        this.isEditable = Array(this.rows.length).fill(false);
        this.totalRemainingQuantity = this.tempEntries.reduce((sum, entry) => sum + entry.remaining, 0);

        this.isSubmitDisabled = this.tempEntries.length === 0;
    }

    finalSubmit() {
        //calcualte total quantity which will be added / dispatched
        const total = this.tempEntries.reduce((sum, entry) => sum + Number(entry.milkQty), 0)


        Swal.fire({
            title: `Are you sure? to ${this.util.isStockIn(this.entryType) ? 'Fill' : 'Dispatch'
                } <span style="color: ${this.util.isStockIn(this.entryType) ? 'green' : 'red'
                }; font-family: monospace;">
              ${total} ${this.entryDetails.unitShortName}
            </span> ${this.entryDetails.productName}`,
            html: `You won't be able to revert this!`, // Use 'html' for custom styling
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
                        entries: this.tempEntries.map(row => {
                            const milkQty = parseFloat(row.milkQty);

                            if (isNaN(milkQty) || milkQty === 0) {
                                this.toastr.error('Invalid milk quantity for some rows.');
                                throw new Error('Invalid milk quantity');
                            }

                            return {
                                siloId: row.siloId,
                                milkQty: Math.abs(milkQty),
                                trnsType: row.trnsType,
                                milkStatus: row.milkStatus
                            };
                        })
                    };

                    this.socketService.emit('ps-silo:add', payload);
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
    //       entries: this.tempEntries.map(row => {
    //         const milkQty = parseFloat(row.milkQty);

    //         if (isNaN(milkQty) || milkQty === 0) {
    //           this.toastr.error('Invalid milk quantity for some rows.');
    //           throw new Error('Invalid milk quantity');
    //         }

    //         return {
    //           siloId: row.siloId,
    //           milkQty: Math.abs(milkQty),
    //           trnsType: row.trnsType,
    //           milkStatus: row.milkStatus
    //         };
    //       })
    //     };

    //     this.socketService.emit('ps-silo:add', payload);
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
        const originalQuantity = this.tempEntries[rowIndex].originalQuantity || 0;
        const quantityDifference = row.milkQty - originalQuantity;

        row.remaining -= quantityDifference;

        this.isEditable[rowIndex] = false;

        this.tempEntries[rowIndex] = { ...row };

        this.updateTableRows();

        this.updateGraph(row.siloName, quantityDifference);
    }

    updateGraph(siloName: string, quantityDifference: number) {
        const siloToUpdate = this.pasteSilodata.find(silo => silo.name === siloName);
        if (siloToUpdate) {
            siloToUpdate.availableMilk += quantityDifference;
            this.updateSeriesAndPercentage(siloToUpdate);
        }
    }

    listenForSilosAdd() {
        const sub = this.socketService.listen('ps-silo:add').subscribe((response: any) => {
            if (response.success) {
                this.toastr.success(response.message);

                this.tempEntries = [];
                this.updateTableRows();
                this.getAllPasteSiloAtChart();

                this.siloDForm.reset();
            } else {
                this.toastr.error(response.message);
            }
        });
        this.subscriptions.push(sub);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    editPsilo(id: number): void {
        this.pid = id;
        this.socketService.emit('pasteurization-dpt:get-data-by-id', { pid: id });
    }
}


interface EntryDetails {
    pid: number;
    EntryId: number;
    entryTypeName: string;
    DepartId: number;
    Department_Name: string;
    DepartHId: number;
    self_approval_status_id: number;
    DepartmenheadName: string;
    destination_status: number;
    approvalname: string;
    pDepartdate: string;
    prodId: number;
    admin_table_id: number;
    productName: string;
    qty: string;
    rejected_quantity: string;
    QtysiloBox: string;
    unitId: number;
    unitShortName: string;
    dbtableName: string;
    dbtableId: number;
    withApproval: boolean;
    approval_status: string;
    manager_approval: string;
    pidStatus: number;
    createBy: number;
    Name: string;
    created_on: string;
}
