import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-update-approval-details',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterModule, NgClass],
    templateUrl: './update-approval-details.component.html',
    styleUrls: ['./update-approval-details.component.scss']
})
export class UpdateApprovalDetailsComponent implements OnInit, OnDestroy {
    imgurl: string;
    approvalForm: FormGroup;
    entry_id: any;
    rows: any[] = [];
    temp: any[] = [];
    aprolDetails: any;
    qualityCt: any;
    userst: any = 0;
    useronlinestatus: any = 0;
    loadingIndicator: boolean = true;
    approvallist: any;
    unitName: string = ''; // Field to hold the unit name
    private subscriptions: Subscription[] = [];

    constructor(
        public baseService: BaseService,
        private socketService: SocketService,
        private toaster: ToastrService,
        private router: Router,
        private formBuilder: FormBuilder,
        private activatedRoute: ActivatedRoute
    ) {
        this.imgurl = baseService.imageurl;
        this.approvalForm = this.formBuilder.group({
            id: [''],
            productname: [''],
            quantity: [0, [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]], // Numeric validation
            priceperunit: [0],
            statusid: ['0', Validators.required],
            message: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        const errorSub = this.socketService.listen('error').subscribe((error: any) => {
            this.toaster.error(error.message);
        });
        this.subscriptions.push(errorSub);

        this.getApprovalSubmitDataListen();
        this.getApprovalSubmitData();

        const msApprovalSub = this.socketService.listen('ms-approval-status:all').subscribe((res: any) => {
            this.approvallist = res.data;
        });
        this.subscriptions.push(msApprovalSub);

        this.socketService.emit('ms-approval-status:all', {});

        const changeStatusSub = this.socketService.listen('approval:insert-update-approval').subscribe((res: any) => {
            if (res.success) {
                this.getApprovalSubmitData();
                this.toaster.success(res.message);
                this.approvalForm.reset({ statusid: 0 });
                return;
            }
            this.toaster.error(res.message);
        });
        this.subscriptions.push(changeStatusSub);

        const detailsSub = this.socketService.listen('approval:detailsbyid').subscribe((res: any) => {
            this.aprolDetails = res.data.approvaldetails[0];
            this.qualityCt = res.data.qualityControlResult;
            this.userst = this.aprolDetails.in_departmenthead_id;
            this.useronlinestatus = this.aprolDetails.indeprt_head_online_status;

            // Update unitName for display and set numeric value for quantity
            this.unitName = this.aprolDetails.unitName;
            this.approvalForm.patchValue({
                id: this.entry_id,
                productname: this.aprolDetails.product_name,
                quantity: parseFloat(this.aprolDetails.quantity), // Ensure it's numeric
                priceperunit: this.qualityCt?.priceper_unit,
            });

            this.socketService.listen('useronlinestatus').subscribe((res: any) => {
                this.userst = res.data.id;
                this.useronlinestatus = res.data.onlineStatus;
            });
        });
        this.subscriptions.push(detailsSub);

        this.entry_id = this.activatedRoute.snapshot.paramMap.get('Id');
        if (this.entry_id !== undefined) {
            this.socketService.emit('approval:detailsbyid', { id: this.entry_id });
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    getApprovalSubmitDataListen(): void {
        this.socketService.listen('approval:detailsbyid').subscribe((res: any) => {
            if (res.success) {
                this.rows = res.data.approvalMultipaldetails;
                console.log("after approval data", this.rows);
            } else {
                this.toaster.error(res.message);
            }
        });
    }

    getApprovalSubmitData(): void {
        this.socketService.emit('approval:detailsbyid', { id: this.entry_id });
    }

    onFormSubmit(): void {
        const formData = { ...this.approvalForm.value };
        formData.quantity = parseFloat(formData.quantity); // Ensure numeric value
        this.socketService.emit('approval:insert-update-approval', formData);
    }
}
