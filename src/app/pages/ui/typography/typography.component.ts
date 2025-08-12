import { Component } from '@angular/core';
import { DirectivesModule } from '../../../theme/directives/directives.module';

@Component({
  selector: 'app-typography',
  standalone: true,
  imports: [
    DirectivesModule
  ],
  templateUrl: './typography.component.html' 
})
export class TypographyComponent {

}
