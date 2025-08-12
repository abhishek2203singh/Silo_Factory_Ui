import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CKEditorModule } from 'ng2-ckeditor';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    FormsModule,
    CKEditorModule
  ],
  templateUrl: './editor.component.html'
})
export class EditorComponent {
  public ckeditorContent: string;
  public config: any;

  constructor() {
    this.ckeditorContent = '<div>Hey we are testing CKEditor</div>';
    this.config = {
      uiColor: '#F0F3F4',
      height: '350',
      extraPlugins: 'divarea'
    };
  }

  onChange(event: any) {
    setTimeout(() => {
      this.ckeditorContent = event;
    });
  }
  onReady(event: any) {
    event.editor.focus();
  }
  onFocus(event: any) {
    // ("editor is focused");
  }
  onBlur(event: any) {
  }

} 