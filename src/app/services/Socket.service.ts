import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import io from 'socket.io-client';
import { AuthModel } from '../Models/auth-model'
import { Constants } from '../Models/constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2'
import { BaseService } from '@services/Base.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {

    socket: any;
    public IsUserLoggedIn: boolean = false;
    storedUser: string | null
    // Initialize authToken with type safety
    authToken: string = "NA";
    //server Environment variables
    // readonly url: string = "https://your-websocket-server-url.com";
    // readonly httpurl: string = " https://your-api-server-url.com";

    // Local Environment variables
    isServerUnreachable: boolean = false;

    reconnect() {
        this.storedUser = localStorage!.getItem("user");
        // if user exists then parse the data
        if (this.storedUser) {
            // Parse and extract accessToken
            const user: UserInfo = JSON.parse(this.storedUser);
            this.authToken = user.accessToken;
        }
        this.socket = io(this.baseService.url, {
            extraHeaders: {
                token: this.authToken
            }
        });
    }

    constructor(private router: Router, private http: HttpClient,
        private baseService: BaseService
    ) {
        // accessign user data from local storage
        this.storedUser = localStorage!.getItem("user");
        // if user exists then parse the data
        if (this.storedUser) {
            // Parse and extract accessToken
            const user: UserInfo = JSON.parse(this.storedUser);
            this.authToken = user.accessToken;
        }



        try {
            this.socket = io(baseService.url, {
                extraHeaders: {
                    token: this.authToken
                }
            });



            this.socket.on("connect_error", (error: any) => {
                this.isServerUnreachable = true;

                // Customize the message based on the error
                const errorMessage = error.message || "Unknown error occurred.";

                Swal.fire({
                    title: "Connection Error",
                    text: `Unable to connect to the server. Possible reasons include:
    - The server may be down.
    - There may be a network issue.
    - The server address is incorrect.
    \n\nError details: ${errorMessage}`,
                    icon: "error",
                    confirmButtonText: "Try Again",
                });
            });

            this.socket.on("connect_timeout", () => {
                this.isServerUnreachable = true;

                Swal.fire({
                    title: "Connection Timeout",
                    text: `The server is taking too long to respond. Possible reasons include:
    - The server is temporarily overloaded.
    - Network connection issues.
    - The server may be down.`,
                    icon: "error",
                    confirmButtonText: "Try Again",
                });
            });

            this.socket.on("reconnect_failed", () => {
                this.isServerUnreachable = true;

                Swal.fire({
                    title: "Reconnection Failed",
                    text: `Unable to reconnect to the server. Possible reasons include:
    - The server is down.
    - Persistent network issues.
    - The server address is incorrect.`,
                    icon: "error",
                    confirmButtonText: "Try Again",
                });
            });

        } catch (error: any) {

            Swal.fire("socket connection error", error.message, "error");
        }
    }

    listen(eventName: string) {
        return new Observable((subscriber) => {
            //  this.socket.off(eventName);
            this.socket.on(eventName, (data: any) => {
                subscriber.next(data);
            });
        })
    }

    emit(eventName: string, data: any) {
        this.socket.emit(eventName, data);
    }

    public Logout() {
        this.IsUserLoggedIn = false;
        // localStorage.clear();
        this.router.navigate(['/login']);
        return true;
    }

    public GetLoggedInUser() {
        var currentUser: AuthModel = JSON.parse(localStorage.getItem(Constants.AuthData)!);
        //
        if (currentUser != null) {
            this.IsUserLoggedIn = true;
            return currentUser;
        }
        else {
            // this.Logout();
            return null;
        }
    }

    uploadimg(API: string, body: any) {
        const formData: FormData = new FormData();
        var file = body[0];
        formData.append('file', file, file.name);
        return this.http.post(this.baseService.httpurl + '/' + API, formData)
    }

    // Sweet alert ==============
    Toast = Swal.mixin({
        toast: true,
        position: 'top-right',
        iconColor: 'white',
        customClass: {
            popup: 'colored-toast',
        },
        // showCancelButton: true,
        showCloseButton: true,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
    })
}

type UserInfo = {
    accessToken: string;
    id: number;
    mobile: string;
    roleId: number;
    departmentId: number;
    socketId: string;
    code: number;
};
