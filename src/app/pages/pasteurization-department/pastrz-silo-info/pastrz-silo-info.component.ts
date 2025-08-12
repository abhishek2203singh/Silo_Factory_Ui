import { Component, inject } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DirectivesModule } from '../../../theme/directives/directives.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '@services/Socket.service';

@Component({
  selector: 'app-pastrz-silo-info',
  standalone: true,
  imports: [NgxChartsModule, DirectivesModule, NgxDatatableModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pastrz-silo-info.component.html',
  styleUrl: './pastrz-silo-info.component.scss'
})
export class PastrzSiloInfoComponent {
  totalCapacity: number = 0;
  totalAvailableSpace: number = 0;
  totalMilkAvailable: number = 0;
  totalMilkSent: number = 0;
  sd_id: any;
  rows: any[] = [];
  isEditable: boolean[] = [];
  isSubmitDisabled: boolean = true;
  silosdata: any[] = [];
  siloDForm: FormGroup;
  silDId: number = 0;
  private socketService = inject(SocketService);

  public colorScheme: any = {
    domain: ['#F47B00', '#E0E0E0']
  };

  public customColors = [
    { name: 'Available', value: '#F47B00' },
    { name: 'Empty', value: '#E0E0E0' }
  ];

  tempEntries: any[] = [];
  totalQuantity: number = 0;
  totalRemainingQuantity: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    public activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    public toastr: ToastrService
  ) {
    this.sd_id = this.activatedRoute.snapshot.paramMap.get("id");
  }

  ngOnInit(): void {
    this.siloDForm = this.fb.group({
      qty: [{ value: '', disabled: true }]
    });

    this.getAllSilosAtChart();
    this.getAllData();
    this.getAllPsiloInfoTable();
    this.getAllPsiloInfo();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  goBack() {
    this.router.navigate(['/pages/pasteurization']);
  }

  cancelForm(item: any) {
    item.showForm = false;
    item.tempQuantity = 0;
  }
  addQuantity(item: any, quantity: number) {
    const newAvailableMilk = Number(item.availableMilk + quantity);
    if (newAvailableMilk <= item.totalcapacity) {
      item.availableMilk = newAvailableMilk;
      this.updateSeriesAndPercentage(item);
    } else {
    }
  }

  subtractQuantity(item: any, quantity: number) {
    const newAvailableMilk = item.availableMilk - quantity;
    if (newAvailableMilk >= 0) {
      item.availableMilk = newAvailableMilk;
      this.updateSeriesAndPercentage(item);
    } else {
    }
  }

  updateSeriesAndPercentage(item: any) {
    item.series[0].value = item.availableMilk;
    item.series[1].value = (item.totalcapacity - item.availableMilk);
    item.extra.percentage = (item.availableMilk / item.totalcapacity) * 100;
  }

  getAllData() {
    this.socketService.listen('ms-ps-silo:all').subscribe((res: any) => {
      if (res?.success) {
        this.silosdata = this.transformData(res.data);
        this.calculateSiloSummary(res.data);
      }
    });
  }

  private calculateSiloSummary(silosData: any[]): void {
    // Calculate summary based on the incoming silos data
    this.totalCapacity = silosData.reduce((sum, silo) => sum + parseFloat(silo.capacity), 0);
    this.totalAvailableSpace = silosData.reduce((sum, silo) =>
      sum + (parseFloat(silo.capacity) - parseFloat(silo.total_available_milk)), 0);
    this.totalMilkAvailable = silosData.reduce((sum, silo) => sum + parseFloat(silo.total_available_milk), 0);

    // Note: totalMilkSent would typically come from a different data source
    // You might need to implement a separate method to fetch this
  }




  getAllSilosAtChart() {
    this.socketService.emit('ms-ps-silo:all', {});
  }

  Infodata: any[] = []

  getAllPsiloInfo() {
    this.socketService.listen('ps-silo:all').subscribe((res: any) => {
      if (res?.success) {
        this.Infodata = res.data;
      }
      // ("data", this.Infodata)
    });
  }

  getAllPsiloInfoTable() {
    this.socketService.emit('ps-silo:all', {});
  }


  transformData(data: any[]): any[] {
    return data.map(item => {
      const availableMilk = parseFloat(item.total_available_milk);
      const totalCapacity = parseFloat(item.capacity);
      const percentage = (availableMilk / totalCapacity) * 100;
      return {
        id: item.id,
        name: item.silo_name,
        totalcapacity: totalCapacity,
        availableMilk: availableMilk,
        extra: {
          percentage: percentage
        },
        series: [
          {
            name: 'Available',
            value: availableMilk
          },
          {
            name: 'Empty',
            value: totalCapacity - availableMilk
          }
        ],
        showForm: false,
        formAction: '',
        tempQuantity: 0
      };
    });
  }


  updateGraph(siloName: string, quantityDifference: number) {
    const siloToUpdate = this.silosdata.find(silo => silo.name === siloName);
    if (siloToUpdate) {
      siloToUpdate.availableMilk += quantityDifference;
      this.updateSeriesAndPercentage(siloToUpdate);
    }
  }
}


