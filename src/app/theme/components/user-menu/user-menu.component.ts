import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BaseService } from '@services/Base.service';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { RouterModule, Router } from '@angular/router';
@Component({
    selector: 'app-user-menu',
    standalone: true,
    imports: [RouterModule,],
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class UserMenuComponent implements OnInit {
    ImgUrl: any;
    loguser: any;
    constructor(private baseService: BaseService, private webSockets: SocketService, public tosService: ToastrService, private router: Router) {
        this.ImgUrl = baseService.imageurl;


    }
    ngOnInit(): void {
        this.webSockets.listen('user:get-log_user').subscribe((res: any) => {
            this.loguser = res.data;
        })
    }
    logout() {
        try {
            this.webSockets.emit("logout", {});
        } catch (error) {
            this.tosService.error("unable to connet to the server")
        }
    }
}