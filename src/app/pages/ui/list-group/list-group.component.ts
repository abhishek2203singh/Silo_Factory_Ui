import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-list-group',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './list-group.component.html' 
})
export class ListGroupComponent {

}
