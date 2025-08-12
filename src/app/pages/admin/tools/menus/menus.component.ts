import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Menu } from '@models/menu.model';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuService } from '@services/menu.service';
import { Settings, SettingsService } from '@services/settings.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'app-dynamic-menu',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        NgbTooltipModule,
        TranslateModule, CommonModule
    ],
    templateUrl: './menus.component.html',
    styleUrl: './menus.component.scss'
})
export class MenusComponent implements OnInit {

    // ********************************************************************************
    menuType: number = 1;
    menuList: MenuItem[] = [];
    subMenuList: SubMenuItem[] = [];
    subsubMenuList: SubSubMenuItem[] = [];
    departments: any[] = [];
    // ********************************************************************************
    public menusForm: FormGroup;
    public targets = ['_blank', '_self'];
    public icons = [
        { name: 'address-card-o', unicode: '&#xf2bc' },
        { name: 'bars', unicode: '&#xf0c9' },
        { name: 'bell-o', unicode: '&#xf0a2' },
        { name: 'tachometer', unicode: '&#xf0e4' },
        { name: 'shopping-bag', unicode: '&#128717' },
        { name: 'calendar', unicode: '&#xf073' },
        { name: 'circle', unicode: '&#xf111' },
        { name: 'circle-o', unicode: '&#xf10c' },
        { name: 'cog', unicode: '&#xf013' },
        { name: 'comment', unicode: '&#xf075' },
        { name: 'comment-o', unicode: '&#xf0e5' },
        { name: 'credit-card', unicode: '&#xf09d' },
        { name: 'desktop', unicode: '&#xf108' },
        { name: 'exclamation-triangle', unicode: '&#xf071' },
        { name: 'folder', unicode: '&#xf07b' },
        { name: 'folder-o', unicode: '&#xf114' },
        { name: 'heart', unicode: '&#xf004' },
        { name: 'search', unicode: '&#xf002' }
    ];

    protected formHeading: { [key: number]: string } = {
        1: "Create New Menu",
        2: "Create New Sub-Menu",
        3: "Create New Sub-Sub Menu",
    }

    protected formLabels: { [key: number]: any } = {
        1: {
            title: "Menu Title",
            routerLink: "Router Link",


        }
    }

    public menuItems: Array<Menu>;
    public settings: Settings;

    constructor(public fb: FormBuilder,
        public toastr: ToastrService,
        public settingsService: SettingsService,
        public translateService: TranslateService,
        private socketService: SocketService,
        private menuService: MenuService) {
        this.settings = this.settingsService.settings;


        this.menusForm = this.fb.group({
            name: ['', Validators.compose([Validators.required, Validators.minLength(3)])],
            route: [" ",],
            icon: [0, [Validators.required]],
            serialNo: [, [Validators.required]],
            hasSubMenus: [false, [Validators.required]],
            departmentId: [0, [Validators.required]],
            parentMenu: [0, this.menuType === 2 || this.menuType === 3 ? [Validators.required] : []],
            grandParentMenu: [0, this.menuType === 3 ? [Validators.required] : []]
        })



    }



    ngOnInit() {

        // listner for errors
        this.socketService.listen('error').subscribe((res: any) => {
            this.toastr.error(res.message);
        })



        // get all menus

        this.socketService.listen('menu:all').subscribe((res: any) => {
            if (res?.success) {
                this.menuList = res.data;
                // ("menus =>", res.data);
                return;
            }
            this.toastr.error(res.message);
        })

        // fetch menus according to department
        this.socketService.listen('menu:all-by-department').subscribe((res: any) => {
            this.menuList = []
            if (res?.success) {
                this.menuList = res.data;
                // ("menus =>", res.data);
                return;
            }
            this.toastr.error(res.message);
        })

        // get all sub menus 
        this.socketService.listen('sub-menu:all-by-department').subscribe((res: any) => {
            this.subMenuList = [];
            if (res?.success) {
                this.subMenuList = res.data;
                // // console.log("sub menus =>", res.data);
                return;
            }
            this.toastr.error(res.message);
        })
        this.socketService.listen('sub-menu:all-by-menu-id').subscribe((res: any) => {
            if (res?.success) {
                // this.subMenuList = [];
                this.subMenuList = res.data;
                // // console.log("subMenuList for selected menu => ", res.data);
                return;
            }
            this.toastr.error(res.message);
        })
        // all sub-menus which are associated with selected menu
        this.socketService.listen('sub-sub-menu:all-by-department').subscribe((res: any) => {
            if (res?.success) {
                this.subsubMenuList = res.data;
                return;
            }
            this.toastr.error(res.message);
        })




        // listner for create menu
        this.socketService.listen('menu:create').subscribe((res: any) => {
            if (res?.success) {
                this.toastr.success(res.message);
                this.resetForm();
                return;
            }
            this.toastr.error(res.message);

        })
        this.socketService.listen('department:all').subscribe((res: any) => {
            if (res?.success) {
                this.toastr.success(res.message);
                this.departments = res.data
                return;
            }
            this.toastr.error(res.message);

        })

        // listner for sub menu
        this.socketService.listen('sub-menu:create').subscribe((res: any) => {

            if (res?.success) {
                this.toastr.success(res.message);

                this.resetForm()
                return;
            }
            this.toastr.error(res.message);

        })
        // sub sub menu
        this.socketService.listen('sub-sub-menu:create').subscribe((res: any) => {

            if (res?.success) {
                this.toastr.success(res.message);
                this.resetForm();
                return;
            }
            this.toastr.error(res.message);

        })


        // emits
        // this.socketService.emit('menu:all', {});
        // this.socketService.emit('sub-menu:all', {});
        // this.socketService.emit('sub-sub-menu:all', {});
        this.socketService.emit("department:all", {});
    }

    resetForm() {

        this.menusForm.reset({
            name: "",
            route: " ",
            icon: 0,
            serialNo: "",
            hasSubMenus: false,
            departmentId: 0,
            parentMenu: 0,
            grandParentMenu: 0

        });

    }

    // fetch all menus according to selectd department
    fetchMenus(event: any, isFetchMenus: boolean = false) {
        const departmentId = event.target.value;
        // fetch menus 
        if (isFetchMenus) { this.socketService.emit("menu:all-by-department", { departmentId }) }

        // if user is creating submenus
        if (this.menuType == 2) { this.socketService.emit("menu:all-by-department", { departmentId }) }
        // if creting sub-sub-munu
        if (this.menuType == 3 && !isFetchMenus) { this.socketService.emit("sub-menu:all-by-department", { departmentId }) }

        // if (this.menuType == 2) { this.socketService.emit("sub-sub-menu:all-by-department", { departmentId }) }
    }
    // fetch all sub-menus according to selectd department
    getSubMenus(event: any) {
        const menuId = event.target.value;
        // // console.log("selected menu id =>", menuId)
        this.socketService.emit("sub-menu:all-by-menu-id", { menuId })
    }
    // fetch all sub-sub-menus according to selectd department
    fetchSubSubMenus(event: any) {
        const departmentId = event.target.value;
        this.socketService.emit("sub-sub-menu:all-by-department", { departmentId })
    }



    public onSubmit(type: number): void {
        // // console.log("form values =>", this.menusForm.value)
        if (this.menusForm.valid) {
            // console.table(this.menusForm.value)
            if (type == 1) {
                this.socketService.emit("menu:create", { ...this.menusForm.value })
                return
            }

            if (type == 2) {

                this.socketService.emit("sub-menu:create", { ...this.menusForm.value })

                return
            }

            else {
                this.socketService.emit("sub-sub-menu:create", { ...this.menusForm.value })
            }
        }

        jQuery('.menu-item-link').tooltip({
            sanitize: false,
            sanitizeFn: function (content: any) {
                return null;
            }
        });
        if (this.settings.theme.menuType == 'mini') {
            jQuery('.menu-item-link').tooltip('enable');
        } else {
            jQuery('.menu-item-link').tooltip('disable');
        }
    }

}

interface MenuItem {
    id: number;
    menu_name: string;
    icon: string;
    serial_no: number;
    has_sub_menu: boolean;
    url_route: string;
    status: number;
}



interface SubMenuItem {
    id: number;
    menu_id: number;
    menu_name: string;
    icon: string;
    serial_no: number;
    url_route: string;
    status: number;
    created_by: number;
    created_on: string; // or use Date if you prefer to work with Date objects
    updated_by: number | null;
    updated_on: string | null; // or use Date if you prefer to work with Date objects
    has_sub_menu: number; // Assuming it's an integer (0 or 1) based on the given data
}

interface SubSubMenuItem {
    id: number;
    menu_id: number;
    menu_name: string;
    icon: string;
    serial_no: number;
    url_route: string;
    status: number;
    created_by: number;
    created_on: string; // or use Date if you prefer to work with Date objects
    updated_by: number | null;
    updated_on: string | null; // or use Date if you prefer to work with Date objects
    has_sub_menu: number; // Assuming it's an integer (0 or 1) based on the given data
}