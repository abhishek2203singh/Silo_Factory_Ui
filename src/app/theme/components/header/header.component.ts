import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Settings, SettingsService } from '@services/settings.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Menu } from '@models/menu.model';
import { MenuService } from '@services/menu.service';
import { NgClass } from '@angular/common';
import { FavoritesComponent } from '@components/favorites/favorites.component';
import { FlagsMenuComponent } from '@components/flags-menu/flags-menu.component';
import { FullScreenComponent } from '@components/fullscreen/fullscreen.component';
import { ApplicationsComponent } from '@components/applications/applications.component';
import { MessagesComponent } from '@components/messages/messages.component';
import { VerticalMenuComponent } from '@components/menu/vertical-menu/vertical-menu.component';
import { HorizontalMenuComponent } from '@components/menu/horizontal-menu/horizontal-menu.component';
import { UserMenuComponent } from '@components/user-menu/user-menu.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService, GlobalConfig } from 'ngx-toastr';
import { SocketService } from '../../../services/Socket.service';
import { BaseService } from '@services/Base.service'
import Swal from 'sweetalert2';
@Component({
    selector: 'app-header',
    standalone: true,
    imports: [
        NgClass,
        FavoritesComponent,
        FlagsMenuComponent,
        FullScreenComponent,
        ApplicationsComponent,
        MessagesComponent,
        VerticalMenuComponent,
        HorizontalMenuComponent,
        UserMenuComponent,
        RouterLink,
        ReactiveFormsModule,
        CommonModule
    ],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('showInfo', [
            state('1', style({ transform: 'rotate(180deg)' })),
            state('0', style({ transform: 'rotate(0deg)' })),
            transition('1 => 0', animate('400ms')),
            transition('0 => 1', animate('400ms'))
        ])
    ]
})
export class HeaderComponent implements OnInit {
    public showHorizontalMenu: boolean = true;
    public showInfoContent: boolean = false;
    public settings: Settings;
    public menuItems: Array<Menu>;
    public router: any;
    public form: FormGroup;
    public mobile: FormControl;
    public password: FormControl;
    msg: any = [];
    getd: any;
    loguser: any;
    ImgUrl: any;
    menuq: any = [];

    constructor(public baseService: BaseService, public settingsService: SettingsService, public menuService: MenuService, router: Router, fb: FormBuilder, public toastr: ToastrService, private webSockets: SocketService) {
        this.settings = this.settingsService.settings;
        this.webSockets.emit("menus:departmentid", {});

        this.menuItems = this.menuService.getHorizontalMenuItems();

        // console.log("== !>> TEMP ", this.menuItems)
        this.router = router;
        this.ImgUrl = baseService.imageurl;

        this.webSockets.listen('user:get-log_user').subscribe((res: any) => {
            this.loguser = res.data;
            // console.log("current logged in user =>", res.data)
            if (res.data.department_id < 11) {
                console.log("this is the department id", res.data.department_id);

                localStorage.setItem("department", res.data.department_name);
                // document.title = res.data.department_name
            }

        })

    }

    ngOnInit() {
        if (window.innerWidth <= 768)
            this.showHorizontalMenu = false;

        this.webSockets.emit("user:get-log_user", {});
        this.webSockets.emit("alert:getbyuserId", {});
        this.webSockets.listen('logout').subscribe((res: any) => {

            if (res.success == true) {
                localStorage.clear();
                this.router.navigate(['/login']);
            }
        })

        this.webSockets.listen("error").subscribe((res: any) => {
            this.toastr.error(res.message)
        })
    }


    public closeSubMenus() {
        let menu = document.querySelector("#menu0");
        if (menu) {
            for (let i = 0; i < menu.children.length; i++) {
                let child = menu.children[i].children[1];
                if (child) {
                    if (child.classList.contains('show')) {
                        child.classList.remove('show');
                        menu.children[i].children[0].classList.add('collapsed');
                    }
                }
            }
        }
    }

    logout() {
        try {
            Swal.fire({
                title: 'Are you sure?',
                text: "You want to logout?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Logout!'
            }).then((result) => {
                // console.log("swal result => ", result)
                if (result.isConfirmed) {
                    this.webSockets.emit("logout", {});
                    return;
                }
                else {
                    Swal.close()
                }
            })
            // 
            // this.webSockets.emit("logout", {});
        } catch (error) {
            this.toastr.error("unable to connect to the server")
        }
    }

    lisLogout() {
        this.webSockets.listen('logout').subscribe((res: any) => {
            if (res.success == true) {
                // localStorage.clear();
                this.router.navigate(['/login']);
            }
        })
    }

    @HostListener('window:resize')
    public onWindowResize(): void {
        if (window.innerWidth <= 768) {
            this.showHorizontalMenu = false;
        }
        else {
            this.showHorizontalMenu = true;
        }
    }

}
