import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './cards.component.html' 
})
export class CardsComponent {

}
