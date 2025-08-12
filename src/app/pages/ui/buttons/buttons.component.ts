import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './buttons.component.html' 
})
export class ButtonsComponent {

}
