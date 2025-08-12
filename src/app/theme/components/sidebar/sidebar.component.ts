import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VerticalMenuComponent } from '@components/menu/vertical-menu/vertical-menu.component';
import { Menu } from '@models/menu.model';
import { MenuService } from '@services/menu.service';
import { Settings, SettingsService } from '@services/settings.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        RouterLink,
        VerticalMenuComponent
    ],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit {
    public settings: Settings;
    public menuItems: Array<Menu>;

    constructor(public settingsService: SettingsService, public menuService: MenuService) {
        this.settings = this.settingsService.settings;
        // this.menuItems = this.menuService.getVerticalMenuItems();
    }

    ngOnInit() {
        const userMenuItems = sessionStorage.getItem("userMenuItems");
        if (!userMenuItems) {
            return;
        }
        let ids: number[] = JSON.parse(userMenuItems);
        let newArr: Menu[] = [];
        ids.forEach((id: number) => {
            let newMenuItem: Menu = this.menuItems.find((menu: Menu) => menu.id == id)!;
            newArr.push(newMenuItem);
        });
        this.menuItems = newArr;
    }

    public closeSubMenus() {
        const menu = document.querySelector("#menu0");
        if (!menu) {
            return;
        }
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
