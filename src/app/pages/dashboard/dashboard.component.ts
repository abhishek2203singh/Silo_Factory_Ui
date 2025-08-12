import { Component } from '@angular/core';
import { InfoPanelsComponent } from './info-panels/info-panels.component';
import { InfoCardsComponent } from './info-cards/info-cards.component';
import { VisitorsComponent } from './visitors/visitors.component';
import { CostComponent } from './cost/cost.component';
import { DiskSpaceComponent } from './disk-space/disk-space.component';
import { TodoComponent } from './todo/todo.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    InfoPanelsComponent,
    InfoCardsComponent,
    VisitorsComponent,
    CostComponent,
    DiskSpaceComponent,
    TodoComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
