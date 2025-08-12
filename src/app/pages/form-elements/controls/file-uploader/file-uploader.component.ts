import { Component } from '@angular/core';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss'
})
export class FileUploaderComponent {
  public file: any;

  fileChange(input: any) {
    const reader = new FileReader();
    if (input.files.length) {
      this.file = input.files[0].name;
    }
  }

  removeFile(): void {
    this.file = '';
  }

}
