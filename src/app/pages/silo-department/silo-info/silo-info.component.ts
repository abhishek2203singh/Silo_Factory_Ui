import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

// Charting and Table modules
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

// Services
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';

// RxJS
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-silo-info',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    NgxDatatableModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './silo-info.component.html',
  styleUrl: './silo-info.component.scss'
})
export class SiloInfoComponent implements OnInit, OnDestroy {
  // Silo Summary Calculation Properties
  totalCapacity: number = 0;
  totalAvailableSpace: number = 0;
  totalMilkAvailable: number = 0;
  totalMilkSent: number = 0;

  // Silo Chart Configuration
  public colorScheme: any = {
    domain: ['#F47B00', '#E0E0E0']
  };

  public customColors = [
    { name: 'Available', value: '#F47B00' },
    { name: 'Empty', value: '#E0E0E0' }
  ];

  // Component Data Properties
  sd_id: any;
  silosdata: any[] = [];
  Infodata: any[] = [];
  siloDForm: FormGroup;

  // Socket and Subscription Management
  private socketService = inject(SocketService);
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
    // Initialize Form
    this.siloDForm = this.fb.group({
      qty: [{ value: '', disabled: true }]
    });

    // Setup Socket Listeners
    this.setupSocketListeners();

    // Fetch Initial Data
    this.getAllSilosAtChart();
    this.getAllSiloInfoTable();
    this.getAllSiloInfo();
  }

  private setupSocketListeners(): void {
    // Listen for Silos Data
    this.subscriptions.push(
      this.socketService.listen('ms-silos:all').subscribe((res: any) => {
        if (res?.success) {
          this.silosdata = this.transformData(res.data);
          this.calculateSiloSummary(res.data);
        }
      })
    );

    // Listen for Silo Info Table Data
    this.subscriptions.push(
      this.socketService.listen('silo-info:all').subscribe((res: any) => {
        if (res?.success) {
          this.Infodata = res.data;
        }
      })
    );
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

  getAllSilosAtChart(): void {
    this.socketService.emit('ms-silos:all', {});
  }

  getAllSiloInfoTable(): void {
    this.socketService.emit('silo-info:all', {});
  }

  getAllSiloInfo(): void {
    this.socketService.emit('silo-info:all', {});
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

  goBack(): void {
    this.router.navigate(['/pages/Silo-Department']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}