import { Component, OnInit, ViewEncapsulation, Pipe } from '@angular/core';
import { MessagesService } from '@services/messages.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { PipesModule } from '../../pipes/pipes.module';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';
import { BaseService } from '@services/Base.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-messages',
    standalone: true,
    imports: [
        NgScrollbarModule,
        PipesModule,
        NgxDatatableModule,
        CommonModule
    ],
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [MessagesService]
})

export class MessagesComponent implements OnInit {
  public messages: Array<any>;
  ImgUrl: any;
  loguser: any;
  countAlert: any;
  router: any = new Router();
  constructor(private webSockets: SocketService, public tosService: ToastrService, public base: BaseService, router: Router,) {
    this.ImgUrl = base.imageurl;
    this.router = router;
    this.webSockets.listen('alert:getbyuserId').subscribe((res: any) => {
      this.countAlert = 0 ;
      this.messages = [];
      this.messages = res.data.alertdetails;
      this.countAlert = res.data.alertCount
    })
  }
  alertDetails() {
    this.router.navigate(['/pages/alertdetails']);
  }
  ngOnInit() {
    jQuery('#messagesTabs').on('click', '.nav-item a', function () {
      setTimeout(() => jQuery(this).closest('.dropdown').addClass('show'));
    })
  }

}
