import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { horizontalMenuItems } from '@data/menu-items';
import { Menu } from '@models/menu.model';
import { TranslateService } from '@ngx-translate/core';
import { SocketService } from './Socket.service';
import { BehaviorSubject } from 'rxjs';
@Injectable({
    providedIn: 'root'
})

export class MenuService {
    private renderer2: Renderer2;
    DepartmentId: number | null = null;
    RoleId: number | null = null;
    public Userdata: any;
    menuq: any = [];
    private inventoryRoutes = {
        4: 'pages/inventory/silo',
        5: 'pages/inventory/pasteurization',
        7: 'pages/inventory/product',
        8: 'pages/inventory/stock'
    };
    private menuChangedSource = new BehaviorSubject<boolean>(false);
    menuChanged$ = this.menuChangedSource.asObservable();

    updateMenu(deptId: number, roleId: number) {
        this.DepartmentId = deptId;
        this.RoleId = roleId;
        this.menuChangedSource.next(true);
        console.log(`Menu updated: DepartmentId=${deptId}, RoleId=${roleId}`);

    }
    private packagingRoutes = {
        20: 'pages/inventory/finished-packaging',
        50: 'pages/inventory/unfinished-packaging',
    };

    constructor(private location: Location,
        private rendererFactory: RendererFactory2,
        private router: Router, private webSockets: SocketService,
        public translateService: TranslateService) {
        this.renderer2 = rendererFactory.createRenderer(null, null)
        this.Userdata = JSON.parse(localStorage.getItem('user') || '{}');
        if (this.Userdata != null) {
            this.DepartmentId = this.Userdata.departmentId;
            this.RoleId = this.Userdata.roleId;
        }
    }

    public getHorizontalMenuItems(): Array<Menu> {
        // customer
        if (this.RoleId == 4 && this.DepartmentId == 6) {
            return [
                new Menu(101, 'Dashboard', '/pages/customer', null, 'tachometer', null, false, 0),
                new Menu(102, 'Profile', '/pages/customer/profile', null, 'user', null, false, 0),
                new Menu(103, 'Orders', '/pages/customer/orders', null, 'shopping-cart', null, false, 0),
                new Menu(104, 'Subscriptions', '/pages/customer/subscriptions', null, 'list-ul', null, false, 0),
            ];
        }
        if (this.RoleId == 1 && this.DepartmentId == 1) {
            this.webSockets.listen('menus:departmentid').subscribe((res: any) => {
                this.menuq = [];
                let data = res.data;
                for (let i = 0; i < data.length; i++) {
                    this.menuq.push(new Menu(data[i].serial_no, data[i].menu_name, data[i].url_route, null, 'tachometer', null, false, 0),)
                }
                // debugger
                //// console.log("myarray : ", this.menuq);
                //this.menuItems = this.menuq;
                //// console.log(this.menuItems);
            })

            return [
                // Main Menu Items
                new Menu(1, 'Dashboard', '/pages/admin', null, 'tachometer', null, false, 0),
                new Menu(2, 'User', '/pages/users', null, 'users', null, false, 0),
                // new Menu(32, 'Inventories', null, null, 'database', null, true, 0),
                //new Menu(25, 'Pasteurization', this.inventoryRoutes[5], null, 'database', null, false, 32),
                new Menu(26, 'Packaging', null, null, 'archive', null, true, 32),
                //new Menu(27, 'Product', this.inventoryRoutes[7], null, 'cubes', null, false, 32),
                new Menu(28, 'Stock', this.inventoryRoutes[8], null, 'cubes', null, false, 32),
                new Menu(5, 'Finished Stock', this.packagingRoutes[20], null, 'hand-paper-o', null, false, 26),
                new Menu(29, 'Un-Finished Stock', this.packagingRoutes[50], null, 'cubes', null, false, 26),
                new Menu(5, 'Approvals', '/pages/admin/approval-list', null, 'hand-paper-o', null, false, 0),
                new Menu(29, 'Distribution Center', "/pages/distribution-center", null, 'cubes', null, false, 0),
                // Tools Submenu
                new Menu(3, 'Tools', null, null, 'laptop', null, true, 0),
                new Menu(4, 'Menu', null, null, 'wrench', null, true, 3),
                new Menu(9, 'Create Menu', "/pages/admin/tools/create-menus", null, 'wrench', null, false, 4),
                new Menu(41, 'Assign Menu', "/pages/admin/tools/user-menu-mapping", null, 'wrench', null, false, 4),
                new Menu(9, 'Department', "/pages/admin/tools/department", null, 'user', null, false, 3),
                new Menu(11, 'Alert Type', "/pages/admin/tools/alerttype", null, 'bell-o', null, false, 3),
                new Menu(12, 'Products', "/pages/admin/tools/products", null, 'shopping-bag', null, false, 3),
                new Menu(12, 'Approval Status', "/pages/admin/tools/approval-status", null, 'circle-o-notch', null, false, 3),
                new Menu(13, 'Cities', "/pages/admin/tools/cities", null, 'map-marker', null, false, 3),
                new Menu(16, 'Entry Type', "/pages/admin/tools/entrytype", null, 'bell-o', null, false, 3),
                new Menu(17, 'Pasteurization', "/pages/admin/tools/pasteurization-silos", null, 'database', null, false, 3),
                new Menu(18, 'Payment Status', "/pages/admin/tools/payment-status", null, 'credit-card', null, false, 3),
                new Menu(19, 'Payment Type', "/pages/admin/tools/paymenttype", null, 'credit-card', null, false, 3),
                new Menu(21, 'Units', "/pages/admin/tools/units", null, 'bell-o', null, false, 3),
                new Menu(22, 'User Role', "/pages/admin/tools/userrole", null, 'user', null, false, 3),
                new Menu(23, 'Silo', "/pages/admin/tools/master-silos", null, 'user', null, false, 3),
                // new Menu(30, 'Distribution Center', "/pages/admin/tools/distribution-center", null, 'cubes', null, false, 3),
                new Menu(35, 'Packaging Size', "/pages/admin/tools/packaging-size", null, 'shopping-cart', null, false, 3),
                new Menu(36, 'Product Type', "/pages/admin/tools/product-type", null, 'shopping-cart', null, false, 3),
                new Menu(37, 'Product Price', "/pages/admin/tools/vendor-product-price", null, 'paypal', null, false, 3),
                new Menu(38, 'Assign Product to vendor', "/pages/admin/tools/assign-product-to-vendor", null, 'shopping-bag', null, false, 3),
                // Departments Submenu
                new Menu(33, 'Departments', null, null, 'laptop', null, true, 0),
                new Menu(24, 'Silo', "/pages/Silo-Department", null, 'tasks', null, false, 33),
                new Menu(25, 'Pasteurization', "/pages/pasteurization", null, 'database', null, false, 33),
                new Menu(26, 'Packaging', "/pages/packaging-department", null, 'archive', null, false, 33),
                // new Menu(27, 'Product', "/pages/product-department", null, 'cubes', null, false, 33),
                new Menu(28, 'Stock', "/pages/stock-department", null, 'cubes', null, false, 33),
                new Menu(6, 'Other', '/pages/admin/other-department', null, 'expand', null, false, 33),
                new Menu(60, 'Curd Department', '/pages/admin/other-department', null, 'expand', null, false, 33),
                new Menu(66, 'Management Department ', '/pages/admin/other-department', null, 'expand', null, false, 33),
                new Menu(67, 'Product Factory ', '/pages/admin/other-department', null, 'expand', null, false, 33),
                new Menu(70, 'Inventory Department', '/pages/inventory-department', null, 'expand', null, false, 0),
                // new Menu(6, 'Curd Department', 'pages/admin/other-department', null, 'expand', null, false, 33),
                new Menu(31, 'E-Commerce', "/pages/e-commerce", null, 'shopping-cart', null, false, 33)
            ];
        } else if (this.RoleId == 3 && this.DepartmentId == 2) {
            return [
                new Menu(1, 'Dashboard', '/pages/stock-department', null, 'tachometer', null, false, 0),
            ];


        } else if (this.RoleId == 8 && this.DepartmentId == 7) {
            return [
                new Menu(1, 'Retail Shop', '/pages/retail-shops', null, 'tachometer', null, false, 0),
            ];


        } else if (this.RoleId == 3 && this.DepartmentId == 3) {
            return [
                new Menu(1, 'Dashboard', '/pages/packaging-department', null, 'tachometer', null, false, 0),
            ];


        } else if (this.RoleId == 5 && this.DepartmentId == 8) {
            return [
                new Menu(1, 'Dashboard', '/pages/vendor-dashboard', null, 'tachometer', null, false, 0),
                new Menu(2, ' Reports', '/pages/vendor-reports', null, 'users', null, false, 0),
                new Menu(3, 'Payments', '/pages/vendor-payment', null, 'laptop', null, false, 0)
            ];
        }
        else if (this.RoleId == 3 && this.DepartmentId == 2) {
            return [
                new Menu(1, 'Dashboard', '/pages/stock-department', null, 'tachometer', null, false, 0),
            ];

        } else if (this.RoleId == 11 && this.DepartmentId == 9) {
            return [
                new Menu(1, 'Dashboard', '/pages/qualitypanel', null, 'tachometer', null, false, 0)
            ];
        } else if (this.RoleId == 3 && this.DepartmentId == 5) {
            return [
                new Menu(1, 'Dashboard', '/pages/pasteurization', null, 'tachometer', null, false, 0)
            ];
        } else if (this.RoleId == 2 && this.DepartmentId == 9) {
            return [
                new Menu(1, 'Dashboard', '/pages', null, 'tachometer', null, false, 0)
            ];
        } else if (this.RoleId == 3 && this.DepartmentId == 4) {
            return [
                new Menu(1, 'Silo Department', '/pages/Silo-Department', null, 'tachometer', null, false, 0)
            ];
        } else if (this.RoleId == 2 && this.DepartmentId == 10) {
            return [
                new Menu(1, 'Dashboard', '/pages/qualitymanagerdashboard', null, 'tachometer', null, false, 0),
                new Menu(2, 'Ecomm Info', '/pages/e-commerce', null, 'tachometer', null, false, 0)
            ];
        } else if (this.RoleId == 12 && this.DepartmentId == 6) {
            return [
                new Menu(54, 'Distribution Center', '/pages/distribution-center', null, 'cubes', null, false, 0),
                new Menu(58, 'Orders', '/pages/order', null, 'cart-arrow-down', null, false, 0),
                new Menu(55, 'Delivery Person', '/pages/delivery-person', null, 'users', null, false, 0),
                new Menu(56, 'Customer', '/pages/Distribution-Center/customer', null, 'users', null, false, 0),
                // new Menu(57, 'Product Delivery List', '/pages/product-delivery-list', null, 'cubes', null, false, 0),
            ];
        } else if (this.RoleId == 3 && this.DepartmentId == 11) {
            return [
                new Menu(61, 'Other Department', '/pages/admin/other-department', null, 'cubes', null, false, 0)
            ]
        }
        else if (this.RoleId == 31 && this.DepartmentId == 36) {
            return [
                new Menu(70, 'Inventory Department', '/pages/inventory-department', null, 'cubes', null, false, 0)
            ]
        }
        else {
            return [new Menu(61, '', '/pages/admin/other-department', null, 'cubes', null, false, 0)];
        }
    }

    public createMenu(menu: Array<Menu>, nativeElement: any, type: string) {
        if (type == 'vertical') {
            this.createVerticalMenu(menu, nativeElement);
        }
        if (type == 'horizontal') {
            this.createHorizontalMenu(menu, nativeElement);
        }
    }

    public createVerticalMenu(menu: Array<Menu>, nativeElement: any) {
        let menu0 = this.renderer2.createElement('div');
        this.renderer2.setAttribute(menu0, 'id', 'menu0');

        menu.forEach((menuItem) => {

        });

        //  if (menuItem.parentId == 0) {
        // let subMenu = this.createVerticalMenuItem(menu, menuItem);
        // this.renderer2.appendChild(menu0, subMenu);
        //  }

        this.renderer2.appendChild(nativeElement, menu0);
    }

    public createHorizontalMenu(menu: Array<Menu>, nativeElement: any) {
        let nav = this.renderer2.createElement('div');
        this.renderer2.setAttribute(nav, 'id', 'navigation');
        let ul = this.renderer2.createElement('ul');
        this.renderer2.addClass(ul, 'menu');
        this.renderer2.appendChild(nav, ul);
        menu.forEach((menuItem) => {
            if (menuItem.parentId == 0) {
                let subMenu = this.createHorizontalMenuItem(menu, menuItem);
                this.renderer2.appendChild(ul, subMenu);
            }
        });
        this.renderer2.appendChild(nativeElement, nav);
    }
    public createHorizontalMenuItem(menu: Array<Menu>, menuItem: any) {
        let li = this.renderer2.createElement('li');
        this.renderer2.addClass(li, 'menu-item');
        let link = this.renderer2.createElement('a');
        this.renderer2.addClass(link, 'menu-item-link');
        this.renderer2.setAttribute(link, 'data-toggle', 'tooltip');
        this.renderer2.setAttribute(link, 'data-placement', 'top');
        this.renderer2.setAttribute(link, 'data-animation', 'false');
        this.renderer2.setAttribute(link, 'data-container', '.horizontal-menu-tooltip-place');
        this.renderer2.setAttribute(link, 'data-original-title', this.translateService.instant(menuItem.title));

        let icon = this.renderer2.createElement('i');
        this.renderer2.addClass(icon, 'fa');
        this.renderer2.addClass(icon, 'fa-' + menuItem.icon);
        this.renderer2.appendChild(link, icon);

        let span = this.renderer2.createElement('span');
        this.renderer2.addClass(span, 'menu-title');
        this.renderer2.appendChild(link, span);

        let menuText = this.renderer2.createText(this.translateService.instant(menuItem.title));
        this.renderer2.appendChild(span, menuText);
        this.renderer2.appendChild(li, link);
        this.renderer2.setAttribute(link, 'id', 'link' + menuItem.id);
        this.renderer2.addClass(link, 'transition');

        if (menuItem.routerLink) {
            this.renderer2.listen(link, "click", (event) => {
                event.preventDefault(); // Prevent default behavior

                // Remove active class from all links first
                this.removeActiveFromAllLinks(menu);

                // Add active class to clicked link
                this.renderer2.addClass(link, 'active-link');

                // Navigate to route
                this.router.navigate([menuItem.routerLink]);
            });
        }

        if (menuItem.href) {
            this.renderer2.setAttribute(link, 'href', menuItem.href);
        }

        if (menuItem.target) {
            this.renderer2.setAttribute(link, 'target', menuItem.target);
        }

        if (menuItem.hasSubMenu) {
            this.renderer2.addClass(li, 'menu-item-has-children');
            let subMenu = this.renderer2.createElement('ul');
            this.renderer2.addClass(subMenu, 'sub-menu');
            this.renderer2.appendChild(li, subMenu);
            this.createSubMenu(menu, menuItem.id, subMenu, 'horizontal');
        }

        return li;
    }
    // Add this new method to remove active class from all links
    private removeActiveFromAllLinks(menu: Array<Menu>) {
        menu.forEach((menuItem) => {
            let activeLink = document.querySelector("#link" + menuItem.id);
            if (activeLink && activeLink.classList.contains('active-link')) {
                this.renderer2.removeClass(activeLink, 'active-link');
            }
        });
    }

    private createSubMenu(menu: Array<Menu>, menuItemId: number, parentElement: any, type: string) {
        let menus = menu.filter(item => item.parentId === menuItemId);
        menus.forEach((menuItem) => {
            let subMenu = null;
            // if (type == 'vertical') {
            //   subMenu = this.createVerticalMenuItem(menu, menuItem);
            // }
            if (type == 'horizontal') {
                subMenu = this.createHorizontalMenuItem(menu, menuItem);
            }
            this.renderer2.appendChild(parentElement, subMenu);
        });
    }

    private closeOtherSubMenus(elem: any) {
        let children = (this.renderer2.parentNode(elem)).children;
        for (let i = 0; i < children.length; i++) {
            let child = this.renderer2.nextSibling(children[i].children[0]);
            if (child) {
                this.renderer2.addClass(children[i].children[0], 'collapsed');
                this.renderer2.removeClass(child, 'show');
            }
        }
    }

    public getActiveLink(menu: Array<Menu>) {
        let url = this.location.path();
        let routerLink = (url) ? url : '/';
        // url.substring(1, url.length);
        let activeMenuItem = menu.filter(item => item.routerLink === routerLink);
        // If an active menu item is found, return the corresponding link element
        if (activeMenuItem[0]) {
            let activeLink = document.querySelector("#link" + activeMenuItem[0].id);

            return activeLink;
        }
        return false;
    }

    public setActiveLink(menu: Array<Menu>, link: any) {

        if (link) {

            // Remove active class from all links
            this.removeActiveFromAllLinks(menu);

            // Add active class to the target link
            this.renderer2.addClass(link, 'active-link');
        }
    }

    public showActiveSubMenu(menu: Array<Menu>) {
        let url = this.location.path();
        let routerLink = url; //url.substring(1, url.length);
        let activeMenuItem = menu.filter(item => item.routerLink === routerLink);
        if (activeMenuItem[0]) {
            let activeLink = document.querySelector("#link" + activeMenuItem[0].id);
            let parent = this.renderer2.parentNode(activeLink);

            while (this.renderer2.parentNode(parent)) {

                parent = this.renderer2.parentNode(parent);

                if (parent.classList.contains('collapse')) {
                    let parentMenu = menu.filter(item => item.id === activeMenuItem[0].parentId);
                    let activeParentLink = document.querySelector("#link" + parentMenu[0].id);
                    this.renderer2.removeClass(activeParentLink, 'collapsed');
                    this.renderer2.addClass(parent, 'show');
                }

                if (parent.classList.contains('menu-wrapper')) {
                    break;
                }

            }
        }
    }

    public addNewMenuItem(menu: Array<Menu>, newMenuItem: any, type: string) {
        menu.push(newMenuItem);

        if (newMenuItem.parentId != 0) {
            let parentMenu = menu.filter(item => item.id === newMenuItem.parentId);
            if (parentMenu.length) {
                if (!parentMenu[0].hasSubMenu) {
                    parentMenu[0].hasSubMenu = true;
                    // parentMenu[0].routerLink = null;
                }
            }
        }

        let menu_wrapper = null;

        // if (type == 'vertical') {
        //   menu_wrapper = document.getElementById('vertical-menu');
        // }

        if (type == 'horizontal') {
            menu_wrapper = document.getElementById('horizontal-menu');
        }

        if (!menu_wrapper) {
            return;
        }

        while (menu_wrapper.firstChild) {
            menu_wrapper.removeChild(menu_wrapper.firstChild);
        }
        this.createMenu(menu, menu_wrapper, type);
    }

}