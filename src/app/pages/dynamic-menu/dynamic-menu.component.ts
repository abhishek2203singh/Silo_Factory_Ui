import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Menu } from '@models/menu.model';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuService } from '@services/menu.service';
import { Settings, SettingsService } from '@services/settings.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs';

@Component({
    selector: 'app-dynamic-menu',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        NgbTooltipModule,
        TranslateModule
    ],
    templateUrl: './dynamic-menu.component.html'
})
export class DynamicMenuComponent implements OnInit {
    public form: FormGroup;
    public targets = ['_blank', '_self'];
    public icons = [
        { name: 'address-card-o', unicode: '&#xf2bc' },
        { name: 'bars', unicode: '&#xf0c9' },
        { name: 'bell-o', unicode: '&#xf0a2' },
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

    public menuItems: Array<Menu>;
    public settings: Settings;

    constructor(public fb: FormBuilder,
        public toastrService: ToastrService,
        public settingsService: SettingsService,
        public translateService: TranslateService,
        private menuService: MenuService) {
        this.settings = this.settingsService.settings;
        // if (this.settings.theme.menu == 'vertical') {
        //   this.menuItems = this.menuService.getVerticalMenuItems();
        // }

    }

    ngOnInit() {
        this.form = this.fb.group({
            title: ['', Validators.compose([Validators.required, Validators.minLength(3)])],
            routerLink: null,
            href: null,
            icon: null,
            target: null,
            hasSubMenu: false,
            parentId: 0
        })
    }

    ngAfterViewInit() {
        setTimeout(() => {
            if (this.settings.theme.menu == 'horizontal') {
                // debugger
               // this.menuItems = this.menuService.getHorizontalMenuItems();
            }
        }, 2000);

        this.form.valueChanges.pipe(debounceTime(500)).subscribe(menu => {
            if (menu.routerLink && menu.routerLink != '') {
                this.form.controls['href'].setValue(null);
                this.form.controls['href'].disable();
                this.form.controls['target'].setValue(null);
                this.form.controls['target'].disable();
            }
            else {
                this.form.controls['href'].enable();
                this.form.controls['target'].enable();
            }

            if (menu.href && menu.href != '') {
                this.form.controls['routerLink'].setValue(null);
                this.form.controls['routerLink'].disable();
                this.form.controls['hasSubMenu'].setValue(false);
                this.form.controls['hasSubMenu'].disable();
            }
            else {
                this.form.controls['routerLink'].enable();
                this.form.controls['hasSubMenu'].enable();
            }
        })
    }

    public onSubmit(menu: Menu): void {
        if (this.form.valid) {
            let lastId = this.menuItems[this.menuItems.length - 1].id;
            let newMenuItem = new Menu(lastId + 1, menu['title'], menu['routerLink'], menu['href'], menu['icon'], menu['target'], menu['hasSubMenu'], parseInt(menu['parentId'].toString()));
            this.menuService.addNewMenuItem(this.menuItems, newMenuItem, this.settings.theme.menu);
            this.toastrService.success('New menu item successfully added !', menu['title']);
            this.form.reset({
                hasSubMenu: false,
                parentId: 0
            });
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

