import { Component, OnInit, ViewEncapsulation, Pipe } from '@angular/core';
import { MessagesService } from '@services/messages.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { SocketService } from '@services/Socket.service';
import { BaseService } from '@services/Base.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { DatatableComponent, NgxDatatableModule, SelectionType } from '@swimlane/ngx-datatable';


@Component({
  selector: 'app-alert-details',
  standalone: true,
  imports: [NgScrollbarModule,
    NgxDatatableModule,
    CommonModule],
  templateUrl: './alert-details.component.html',
  styleUrl: './alert-details.component.scss'
})
export class AlertDetailsComponent {
  public messages: Array<any>;
  ImgUrl: any;
  loguser: any;
  countAlert: any;
  constructor(private webSockets: SocketService, public tosService: ToastrService, public base: BaseService) {
    this.ImgUrl = base.imageurl;
    this.webSockets.listen('allalertmessage').subscribe((res: any) => {
      this.messages = res.data.alertdetails;
    })
  }

  viewalert(Id: any) {
    this.webSockets.emit("alert:viewbyId", { id: Id });
  }
}
