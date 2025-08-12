import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, ActivatedRouteSnapshot, UrlSegment, NavigationEnd, RouterModule } from "@angular/router";
import { Title } from '@angular/platform-browser';
import { Settings, SettingsService } from '@services/settings.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [
        RouterModule,
        CommonModule
    ],
    encapsulation: ViewEncapsulation.None,
    templateUrl: './breadcrumb.component.html'
})
export class BreadcrumbComponent implements OnInit {
    public settings: Settings;
    isInvoiceRoute: boolean = false;

    public pageTitle: string;
    public breadcrumbs: {
        name: string;
        url: string
    }[] = [];

    constructor(
        public settingsService: SettingsService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public title: Title
    ) {
        this.settings = this.settingsService.settings;

        // Listen to router events to build breadcrumbs and set the page title
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.breadcrumbs = [];
                this.parseRoute(this.router.routerState.snapshot.root);
                this.pageTitle = "";
                
                
                this.breadcrumbs.forEach(breadcrumb => {
                    this.pageTitle += ' > ' + breadcrumb.name;
                });
                this.title.setTitle(this.settings.name + this.pageTitle);
            }
        });
    }

    ngOnInit() {
        // Listen to router events to check if the current route is 'invoice'
        this.router.events.subscribe(() => {
            // Check if the current route contains 'invoice' to hide breadcrumbs
            this.isInvoiceRoute = this.router.url.includes('/pages/Invoice');
        });
    }

    parseRoute(node: ActivatedRouteSnapshot) {
        if (node.data['breadcrumb']) {
            if (node.url.length) {
                let urlSegments: UrlSegment[] = [];
                node.pathFromRoot.forEach(routerState => {
                    urlSegments = urlSegments.concat(routerState.url);
                });
                let url = urlSegments.map(urlSegment => {
                    return urlSegment.path;
                }).join('/');
                this.breadcrumbs.push({
                    name: node.data['breadcrumb'],
                    url: '/' + url
                });
            }
        }
        if (node.firstChild) {
            this.parseRoute(node.firstChild);
        }
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
}
