import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '@models/menu.model';
import { MenuService } from '@services/menu.service';
import { Settings, SettingsService } from '@services/settings.service';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-vertical-menu',
  standalone: true,
  imports: [
    NgScrollbarModule
  ],
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VerticalMenuComponent implements OnInit {
  @Input('menuItems') menuItems: Menu[];
  public settings: Settings;

  constructor(public settingsService: SettingsService, private menuService: MenuService, private router: Router) {
    this.settings = this.settingsService.settings;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
        let activeLink = this.menuService.getActiveLink(this.menuItems);
        this.menuService.setActiveLink(this.menuItems, activeLink);
        jQuery('.tooltip').tooltip({
          sanitize: false,
          sanitizeFn: function (content: any) {
            return null;
          }
        });
        jQuery('.tooltip').tooltip('hide');
        if (window.innerWidth <= 768) {
          this.settings.theme.showMenu = false;
        }
      }
    });
  }

  ngOnInit() {
    let menu_wrapper = document.getElementById('vertical-menu');
    this.menuService.createMenu(this.menuItems, menu_wrapper, 'vertical');

    if (this.settings.theme.menuType == 'mini') {
      jQuery('.menu-item-link').tooltip({
        sanitize: false,
        sanitizeFn: function (content: any) {
          return null;
        }
      });
      jQuery('.menu-item-link').tooltip();
    }

  }

  ngAfterViewInit() {
    this.menuService.showActiveSubMenu(this.menuItems);
    let activeLink = this.menuService.getActiveLink(this.menuItems);
    this.menuService.setActiveLink(this.menuItems, activeLink);
  }

}