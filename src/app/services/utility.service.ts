import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { BaseService } from '@services/Base.service';
@Injectable({
    providedIn: 'root'
})
export class UtilityService {
    stockin = [3, 7];
    stockOut = [2]
    // *****************************************************************
    maxImageSizeIsAllowed: number = 903920;
    // *****************************************************************
    constructor(private baseService: BaseService) { }
    async uploadImageUtility(files: File[]): Promise<UploadResponse> {
        if (files.length === 0) {
            return { error: true, success: false, data: null, filename: '' };
        }
        const file = files[0];
        // console.log("file in util =>", file);
        // Check if the first file is an image
        if (!file.type.match(/image\/.*/)) {
            Swal.fire("", "Please select an image only");
            return { error: true, success: false, data: null, filename: '' };
        }
        // Check if the image size exceeds the maximum allowed size
        if (file?.size > this.maxImageSizeIsAllowed) {
            Swal.fire("Too large image!", `Maximum size allowed is ${this.maxImageSizeIsAllowed / 1000} KB`, "warning");
            return { error: true, success: false, data: null, filename: '' };
        }
        // Attempt to upload the image file
        try {
            const data: any = await firstValueFrom(this.baseService.Postimg("fileUpload", file));
            // console.log("upload result =>", data);
            return { error: false, success: true, ...data };
        } catch (error) {
            // console.log("ERROR =>", error);
            return { error: true, success: false, data: null, filename: '' };
        }
    }
    isStockIn(entryTypeId: number,) {
        return this.stockin.includes(entryTypeId)
    }
    isStockOut(entryTypeId: number, createdBy: number, index: number = 0) {
        const currntUserId = this.getCurrentUser().id;
        const isAdminLogin = currntUserId === 1
        const isCreadedByAdmin = createdBy == 1;
        // // console.log({
        //     isAdminLogin, isCreadedByAdmin, entryTypeId, createdBy, index
        // })
        if (entryTypeId == 4) return true;
        // if entry is created by admin and one of stockOut 
        if (isCreadedByAdmin && isAdminLogin) {
            return this.stockOut.includes(entryTypeId);
        }
        if (isCreadedByAdmin && !isAdminLogin) {
            return this.stockOut.includes(entryTypeId);
        }
        return (this.stockOut.includes(entryTypeId) && createdBy !== currntUserId && !isAdminLogin) ? true : false
    }
    getCurrentUser() {
        const loggedInUser = localStorage!.getItem('user');
        if (loggedInUser) { return JSON.parse(loggedInUser) }
        return false
    }
}
export interface UploadResponse {
    error: boolean;
    success: boolean;
    data?: FileData | null;
    filename: string;
}
interface FileData {
    data: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        bucket: string;
        key: string;
        acl: string;
        contentType: string | null;
        contentDisposition: string | null;
        storageClass: string;
        serverSideEncryption: string | null;
        metadata: {
            fieldName: string;
        };
        location: string;
        etag: string;
        versionId: string;
    };
    filename: string;
}

