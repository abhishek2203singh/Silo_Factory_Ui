import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '../../services/Socket.service';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { UtilityService } from '@services/utility.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CommonModule
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    public form: FormGroup;
    public mobile: FormControl;
    public password: FormControl;
    private subscriptions: Subscription[] = [];
    msg: any = [];
    getd: any;
    currentUser: UserAccessInfo;
    showPassword: boolean = false;

    constructor(
        private router: Router,
        fb: FormBuilder,
        public toastr: ToastrService,
        private webSockets: SocketService,
        public menusev: MenuService,
        private util: UtilityService
    ) {
        this.form = fb.group({
            mobile: ['', [
                Validators.required,
                Validators.pattern(/^\d{10}$/)
            ]],
            password: ['', [
                Validators.required,
                Validators.minLength(6)
            ]],
            source: [1]
        });

        this.mobile = this.form.controls['mobile'] as FormControl;
        this.password = this.form.controls['password'] as FormControl;

        this.currentUser = util.getCurrentUser();
    }

    ngOnInit(): void {
        const sub1 = this.webSockets.listen('error').subscribe((res: any) => {
            this.toastr.error(res.event, res.message);
            this.getd = res;
            this.msg.push({ Mess: this.getd.message });
        });
        this.subscriptions.push(sub1);

        const sub = this.webSockets.listen('user:login').subscribe((res: any) => {
            try {
                if (res.success) {
                    // ✅ LocalStorage me data save
                    const data = JSON.stringify(res.data);
                    localStorage.setItem('user', data);
                    localStorage.setItem('a', data);

                    // ✅ Current user update
                    this.currentUser = res.data;

                    // ✅ MenuService ko turant update karo
                    this.menusev.updateMenu(res.data.departmentId, res.data.roleId);

                    // ✅ Socket reconnect
                    this.webSockets.reconnect();

                    this.toastr.success(res.message);

                    // ✅ Navigation logic
                    this.navigateByRole(res.data);

                } else {
                    this.toastr.error(res.message);
                }
            } catch (error) {
                this.toastr.error("Unable to connect to the server");
            }
        });
        this.subscriptions.push(sub);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    login() {
        if (this.form.valid) {
            try {
                this.webSockets.emit("user:login", this.form.value);
            } catch (error) {
                this.toastr.error("Unable to connect to the server");
            }
        }
    }

    ngAfterViewInit() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hide');
        }
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    private navigateByRole(user: UserAccessInfo) {
        const routes: any = {
            '6_4': '/pages/customer',
            '1_1': '/pages/admin',
            '9_11': '/pages/qualitypanel',
            '5_3': '/pages/pasteurization',
            '4_3': '/pages/Silo-Department',
            '10_2': '/pages/qualitymanagerdashboard',
            '6_12': '/pages/distribution-center',
            '2_3': '/pages/stock-department',
            '3_3': '/pages/packaging-department',
            '7_8': '/pages/retail-shops',
            '8_5': '/pages/vendor-dashboard',
            '36_31': '/pages/inventory-department'
        };

        // isOtherDpt handling
        if (user.isOtherDpt) {
            this.router.navigate([`pages/department/${user.departmentId}`]);
            return;
        }

        const key = `${user.departmentId}_${user.roleId}`;
        if (routes[key]) {
            this.router.navigate([routes[key]]);
        } else {
            this.toastr.error("User Not Valid");
        }
    }
}

type UserAccessInfo = {
    accessToken: string;
    code: number;
    departmentId: number;
    id: number;
    isOtherDpt: boolean;
    mobile: string;
    roleId: number;
    socketId: string;
};
