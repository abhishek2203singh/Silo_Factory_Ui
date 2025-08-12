import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-tabs-accordions',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './tabs-accordions.component.html' 
})
export class TabsAccordionsComponent {

}
