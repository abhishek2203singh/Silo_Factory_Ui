import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './layouts.component.html'
})
export class LayoutsComponent {

}
