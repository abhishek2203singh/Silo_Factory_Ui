import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Settings, SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgClass
  ],
  templateUrl: './app.component.html' 
})
export class AppComponent {
  public settings: Settings;
  constructor(public settingsService: SettingsService, public translate: TranslateService, private router: Router) {
    this.settings = this.settingsService.settings;
    translate.addLangs(['en', 'de', 'fr', 'ru', 'tr']);
    translate.setDefaultLang('en');
    translate.use('en');
  }


  /* These following methods used for theme preview, you can remove this methods */

  // ngOnInit() { 
  //     var demo = this.getParameterByName('demo');
  //     this.setLayout(demo);
  // }

  // private getParameterByName(name: any) {
  //     var url = window.location.href;
  //     name = name.replace(/[\[\]]/g, "\\$&");
  //     var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  //         results = regex.exec(url);
  //     if (!results) return null;
  //     if (!results[2]) return '';
  //     return decodeURIComponent(results[2].replace(/\+/g, " "));
  // }

  // private setLayout(demo: any){
  //      switch (demo) {
  //         case "vertical-default":
  //             this.settings.theme.menu = 'vertical';
  //             this.settings.theme.menuType = 'default';
  //             break;
  //         case "vertical-compact":
  //             this.settings.theme.menu = 'vertical';
  //             this.settings.theme.menuType = 'compact';
  //             break;
  //         case "vertical-mini":
  //             this.settings.theme.menu = 'vertical';
  //             this.settings.theme.menuType = 'mini';
  //             break;
  //         case "horizontal-default":
  //             this.settings.theme.menu = 'horizontal';
  //             this.settings.theme.menuType = 'default';
  //             break;
  //         case "horizontal-compact":
  //             this.settings.theme.menu = 'horizontal';
  //             this.settings.theme.menuType = 'compact';
  //             break;
  //         case "horizontal-mini":
  //             this.settings.theme.menu = 'horizontal';
  //             this.settings.theme.menuType = 'mini';
  //             break;
  //         default:
  //             this.settings.theme.menu = 'vertical';
  //             this.settings.theme.menuType = 'default';
  //     }
  //     this.router.navigate(['/']);
  // }

}
