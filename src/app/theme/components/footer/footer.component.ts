import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Settings, SettingsService } from '@services/settings.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit {
  public settings: Settings;
  isInvoiceRoute: boolean = false;

  constructor(public settingsService: SettingsService, public router: Router) {
    this.settings = this.settingsService.settings;
  }
  ngOnInit() {
    // Listen to router events to check if the current route is 'invoice'
    this.router.events.subscribe(() => {
      // Check if the current route contains 'invoice' to hide breadcrumbs
      this.isInvoiceRoute = this.router.url.includes('/pages/Invoice');
    });
  }
}
