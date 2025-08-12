import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private apiUrl = 'https://your-api-url.com/inventory';

    constructor(private http: HttpClient) { }

    getInventoryByDepartmentName(departmentName: string): Observable<any> {
        return this.http.get(`${this.apiUrl}?departmentName=${departmentName}`);
    }
}
