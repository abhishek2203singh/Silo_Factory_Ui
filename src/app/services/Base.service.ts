import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BaseService {
    // readonly url: string = "paste your websocket url here"; // WebSocket URL
    // readonly httpurl: string = "paste your api link here";

    // Global Url variables 
    // readonly imageurl: string = "paste your image url here"; // Image URL

    constructor(private http: HttpClient) {

    }

    Postimg(API: string, body: any) {
        const formData: FormData = new FormData();
        var file = body;
        // console.log("file in post=>", file)
        formData.append('file', file, body.name);
        const httpOptions = {
            headers: new HttpHeaders({
                //"Authorization": 'Bearer ' + this.GetAuthToken(),
                'Content-Type': 'application/json'
            })
        };
        // return this.http.post(this.httpurl + '/' + API, formData)
    }

}
