import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-media-objects',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './media-objects.component.html' 
})
export class MediaObjectsComponent {

}
