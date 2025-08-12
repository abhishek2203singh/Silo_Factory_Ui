import { Component } from '@angular/core';
import { IconsService } from '@services/icons.service';

@Component({
  selector: 'app-icons',
  standalone: true,
  imports: [],
  templateUrl: './icons.component.html',
  styleUrl: './icons.component.scss',
  providers: [IconsService]
})
export class IconsComponent {
  public icons: any;
  constructor(private iconsService: IconsService) {
    this.icons = iconsService.getIcons();
  }
}
