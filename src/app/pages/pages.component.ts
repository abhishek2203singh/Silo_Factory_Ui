import { NgClass } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BackTopComponent } from '@components/back-top/back-top.component';
import { BreadcrumbComponent } from '@components/breadcrumb/breadcrumb.component';
import { FooterComponent } from '@components/footer/footer.component';
import { HeaderComponent } from '@components/header/header.component';
import { SideChatComponent } from '@components/side-chat/side-chat.component';
import { SidebarComponent } from '@components/sidebar/sidebar.component';
import { Settings, SettingsService } from '@services/settings.service';
import { HorizontalMenuComponent } from "../theme/components/menu/horizontal-menu/horizontal-menu.component";
import { SocketService } from '@services/Socket.service';

@Component({
    selector: 'app-pages',
    standalone: true,
    imports: [
        NgClass,
        HeaderComponent,
        SidebarComponent,
        SideChatComponent,
        BreadcrumbComponent,
        RouterOutlet,
        FooterComponent,
        BackTopComponent
    ],
    templateUrl: './pages.component.html',
    styleUrl: './pages.component.scss'
})
export class PagesComponent implements OnInit {
    public showMenu: boolean = false;
    public showSetting: boolean = false;
    public menus = ['vertical', 'horizontal'];
    public menuOption: string;
    public menuTypes = ['default', 'compact', 'mini'];
    public menuTypeOption: string;
    public settings: Settings;

    constructor(public settingsService: SettingsService,
        private socketService: SocketService,
        public router: Router) {
        this.settings = this.settingsService.settings;
        if (sessionStorage["skin"]) {
            this.settings.theme.skin = sessionStorage["skin"];
        }
    }

    ngOnInit() {
        if (window.innerWidth <= 768) {
            this.settings.theme.showMenu = false;
            this.settings.theme.sideChatIsHoverable = false;
        }
        this.showMenu = this.settings.theme.showMenu;
        this.menuOption = this.settings.theme.menu;
        this.menuTypeOption = this.settings.theme.menuType;
    }

    public chooseMenu(menu: string) {
        this.settings.theme.menu = menu;
        this.router.navigate(['/']);
    }

    public chooseMenuType(menuType: string) {
        this.settings.theme.menuType = menuType;
        jQuery('.menu-item-link').tooltip({
            sanitize: false,
            sanitizeFn: function (content: any) {
                return null;
            }
        });
        if (menuType == 'mini') {
            jQuery('.menu-item-link').tooltip('enable');
        } else {
            jQuery('.menu-item-link').tooltip('disable');
        }
    }

    public changeTheme(theme: string) {
        this.settings.theme.skin = theme;
        sessionStorage["skin"] = theme;
    }

    ngAfterViewInit() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hide');
        }
    }

    @HostListener('window:resize')
    public onWindowResize(): void {
        let showMenu = !this._showMenu();

        if (this.showMenu !== showMenu) {
            this.showMenuStateChange(showMenu);
        }
        this.showMenu = showMenu;
    }

    public showMenuStateChange(showMenu: boolean): void {
        this.settings.theme.showMenu = showMenu;
    }

    private _showMenu(): boolean {
        return window.innerWidth <= 768;
    }

}
