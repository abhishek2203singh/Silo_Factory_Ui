import { Component, inject, OnInit } from '@angular/core';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { IadminData } from '../../../../Models/admin';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-info-custom-card',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './info-custom-card.component.html',
  styleUrl: './info-custom-card.component.scss'
})
export class InfoCustomCardComponent implements OnInit {
  alladminData: any;
  private sktService = inject(SocketService);
  private toastr = inject(ToastrService);

  totalCapacity: number = 0;
  totalDeliveryboy: number = 0;
  totalAvailableSpace: number = 0;
  totalMilkAvailable: number = 0;
  totalMilkSent: number = 0;
  silosdata: any[] = [];
  Infodata: any[] = [];

  private socketService = inject(SocketService);
  private subscriptions: Subscription[] = [];


  constructor(
    public activatedRoute: ActivatedRoute,
    private router: Router,
  ) {

  }

  ngOnInit(): void {
    this.alladminData = new IadminData();
    this.adminDataListen();
    this.adminData();
    this.setupSocketListeners();
    this.getAllSilosAtChart();
    this.getAllSiloInfoTable();
    this.getAllSiloInfo();
  }


  adminDataListen() {
    this.sktService.listen('admin:dashboard').subscribe((res: any) => {
      if (res.success) {
        this.alladminData = res.data
        // // console.log("dataa", this.alladminData);

      } else {
        this.toastr.error(res.message)
      }
    })
  }

  adminData() {
    this.sktService.emit('admin:dashboard', {});
  }



  private setupSocketListeners(): void {
    // Listen for Silos Data
    this.subscriptions.push(
      this.socketService.listen('ms-silos:all').subscribe((res: any) => {
        if (res?.success) {
          this.silosdata = this.transformData(res.data);
          // // console.log("adc", this.silosdata);

          this.calculateSiloSummary(res.data);
        }
      })
    );

    // Listen for Silo Info Table Data
    this.subscriptions.push(
      this.socketService.listen('silo-info:all').subscribe((res: any) => {
        if (res?.success) {
          this.Infodata = res.data;
          // // console.log("infodata", this.Infodata);

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


  getAllSiloInfoTable(): void {
    this.socketService.emit('silo-info:all', {});
  }

  getAllSiloInfo(): void {
    this.socketService.emit('silo-info:all', {});
  }



}
