import { Component, OnInit, ViewEncapsulation, ElementRef, Input, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '@models/menu.model';
import { MenuService } from '@services/menu.service';
import { Settings, SettingsService } from '@services/settings.service';

@Component({
    selector: 'app-horizontal-menu',
    standalone: true,
    templateUrl: './horizontal-menu.component.html',
    styleUrls: ['./horizontal-menu.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HorizontalMenuComponent implements OnInit, AfterViewInit {

    @Input('menuItems') menuItems: Menu[];
    public settings: Settings;

    constructor(
        public settingsService: SettingsService,
        private menuService: MenuService,
        private router: Router,
        private elementRef: ElementRef
    ) {
        this.settings = this.settingsService.settings;

        // Listen to route changes to update active menu
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                window.scrollTo(0, 0);

                // Set active link based on current route
                setTimeout(() => {
                    let activeLink = this.menuService.getActiveLink(this.menuItems);
                    this.menuService.setActiveLink(this.menuItems, activeLink);
                }, 100);

                // Handle tooltips
                this.handleTooltips();
            }
        });
    }

    ngOnInit() {
        let menu_wrapper = this.elementRef.nativeElement.children[0];
        this.menuService.createMenu(this.menuItems, menu_wrapper, 'horizontal');

        if (this.settings.theme.menuType == 'mini') {
            this.initializeTooltips();
        }
        let activeLink = this.menuService.getActiveLink(this.menuItems);
        this.menuService.setActiveLink(this.menuItems, activeLink);
    }

    ngAfterViewInit() {
        // Set initial active link after view is initialized



    }

    private handleTooltips() {
        if (typeof jQuery !== 'undefined') {
            jQuery('.tooltip').tooltip({
                sanitize: false,
                sanitizeFn: function (content: any) {
                    return null;
                }
            });
            jQuery('.tooltip').tooltip('hide');
        }
    }

    private initializeTooltips() {
        if (typeof jQuery !== 'undefined') {
            jQuery('.menu-item-link').tooltip({
                sanitize: false,
                sanitizeFn: function (content: any) {
                    return null;
                }
            });
            jQuery('.menu-item-link').tooltip();
        }
    }
}