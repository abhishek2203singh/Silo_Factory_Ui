

import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { LogarithmicScale } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-admin-approval-details',
    standalone: true,
    imports: [NgxDatatableModule, CommonModule, ReactiveFormsModule, RouterModule, NgClass],
    templateUrl: './admin-approval-details.component.html',
    styleUrl: './admin-approval-details.component.scss'
})
export class AdminApprovalDetailsComponent implements OnInit, OnDestroy {
    entry_type_id: number;
    imgurl: string;
    approvalForm: FormGroup;
    entry_id: string;
    admin_table_ref_id: string;
    rows: any[] = [];
    temp: any[] = [];
    dataofapproval: any[] = [];
    secondData: any;
    aprolDetails: any;
    qualityCt: any;
    userst: number = 0;
    useronlinestatus: number = 0;
    loadingIndicator: boolean = true;
    approvallist: any;
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
            'id': [''],
            'productname': [''],
            'entry_type_name': [''],
            'quantity': [''],
            'unit': [''],
            'priceperunit': [''],
            'statusid': ['0', Validators.required],
            'message': ['', Validators.required],
        });

    }

    ngOnInit(): void {
        this.subscribeToSocketEvents();
        this.fetchApprovalStatuses();
        this.getdataOfApproval();
        const getdataOfApprovalListen = this.socketService.listen('approval:detailsbyid').subscribe((res: any) => {
            if (res.success) {
                this.dataofapproval = res.data.approvalMultipaldetails;
                console.log("after approval data", this.dataofapproval);

            }
        })
        //  const getApprovalSubmitDataListen = this.socketService.listen('approval:detailsbyid').subscribe((res: any) => {
        //     if (res.success) {
        //         const approvalDetails = res.data.approvaldetails[0];
        //         this.entry_type_id=approvalDetails.entry_type_id;
        //     this.secondData = res.data.previousRecord;
        //         // if (approvalDetails.entry_type_id == 7) {
        //         // }
        //         // else {
        //         //     this.dataofapproval = res.data.approvalMultipaldetails;
        //         // }

        //     } else {
        //         this.toaster.error(res.message);
        //     }
        // });

        this.getApprovalSubmitData()


        this.entry_id = this.activatedRoute.snapshot.paramMap.get("Id") || '';
        if (this.entry_id) {
            this.socketService.emit("approval:detailsbyid", { id: this.entry_id });
        }

    }
    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private subscribeToSocketEvents(): void {
        const errorSub = this.socketService.listen('error').subscribe((error: any) => {
            this.toaster.error(error.message);
        });
        this.subscriptions.push(errorSub);

        const chengeStatusSub = this.socketService.listen('approval:insert-update-approval').subscribe((res: any) => {
            if (res.success) {
                this.getApprovalSubmitData();
                this.toaster.success(res.message);
                this.approvalForm.reset({ statusid: 0 });
                return;
            }
            this.toaster.error(res.message);
        });
        this.subscriptions.push(chengeStatusSub);

        const detailsSub = this.socketService.listen('approval:detailsbyid').subscribe((res: any) => {
            // console.log("approvalMultipaldetails =>", res.data.approvalMultipaldetails)
            const approvalDetails = res.data.approvaldetails[0];
            this.secondData = res.data.previousRecord;
            this.admin_table_ref_id = res.data.approvaldetails[0]
            this.aprolDetails = res.data.approvaldetails[0];
            // // console.log("second =>", this.aprolDetails)
            this.qualityCt = res.data.qualityControlResult;
            this.userst = this.aprolDetails.in_departmenthead_id;
            this.useronlinestatus = this.aprolDetails.indeprt_head_online_status;

            this.updateApprovalForm();
        });

        // const detailsSub = this.socketService.listen('approval:detailsbyid').subscribe((res: any) => {
        //     this.admin_table_ref_id=res.data.approvaldetails[0]
        //     this.aprolDetails = res.data.approvaldetails[0];
        //     this.qualityCt = res.data.qualityControlResult;
        //     this.userst = this.aprolDetails.in_departmenthead_id;
        //     this.useronlinestatus = this.aprolDetails.indeprt_head_online_status;
        //     this.updateApprovalForm();
        // });
        this.subscriptions.push(detailsSub);

        const userOnlineStatusSub = this.socketService.listen('useronlinestatus').subscribe((res: any) => {
            this.userst = res.data.id;
            this.useronlinestatus = res.data.onlineStatus;
        });
        this.subscriptions.push(userOnlineStatusSub);
    }

    private fetchApprovalStatuses(): void {
        const approvalStatusSub = this.socketService.listen('ms-approval-status:all').subscribe((res: any) => {
            this.approvallist = res.data;
        });
        this.subscriptions.push(approvalStatusSub);

        this.socketService.emit("ms-approval-status:all", {});
    }

    private updateApprovalForm(): void {
        this.approvalForm.patchValue({
            id: this.entry_id,
            productname: this.aprolDetails.product_name,
            entry_type_name: this.aprolDetails.entry_type_name,
            quantity: this.aprolDetails.quantity,
            unit: this.aprolDetails.unitName,
            priceperunit: this.qualityCt?.priceper_unit
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getApprovalSubmitData() {
        this.socketService.emit('approval:detailsbyid', { id: this.entry_id });
    }

    // getApprovalData() {
    //     this.socketService.emit('approval:detailsbyid', { id: this.admin_table_ref_id });
    // }

    onFormSubmit(): void {
        const formData = { ...this.approvalForm.value };
        this.socketService.emit('approval:insert-update-approval', formData);
    }


    getdataOfApproval() {
        this.socketService.emit('approval:detailsbyid', {})
    }


}




