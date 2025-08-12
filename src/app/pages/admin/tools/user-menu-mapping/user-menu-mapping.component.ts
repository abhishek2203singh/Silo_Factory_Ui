

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@services/Socket.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface Permission {
  read: boolean;
  write: boolean;
  edit: boolean;
}

interface MenuItem {
  title: string;
  permissions: Permission;
}
interface MenuItem {
  title: string;
  permissions: Permission;
  hasSubMenu?: MenuItem[];
  isSubMenuExpanded?: boolean;
}




@Component({
  selector: 'app-user-menu-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-menu-mapping.component.html',
  styleUrl: './user-menu-mapping.component.scss'
})
export class UserMenuMappingComponent implements OnInit {
  departmentList: any[] = [];
  private socketService = inject(SocketService);
  users: any[] = [];
  temp: any[] = [];
  menusList: any[] = [];
  selectedUser: any = 0;

  // users: User[] = [
  //   { id: 1, name: 'Alice (HR)' },
  //   { id: 2, name: 'Bob (HR)' },
  //   { id: 3, name: 'Charlie (IT)' },
  //   { id: 4, name: 'David (IT)' },
  //   { id: 5, name: 'Eve (Finance)' },
  //   { id: 6, name: 'Frank (Finance)' }
  // ];

  selectedDepartment: number | null = null;
  selectedUserName: string = '';
  menuItems: MenuItem[] = [];

  menusArray: any = [];


  constructor(
    private toaster: ToastrService,
    private router: Router,
    private toastr: ToastrService
  ) {
  }

  ngOnInit() {
    this.getallDepartmentListen();
    this.emitDepartmentList();
    this.onUserChangeListen();

    this.socketService.listen("user:all").subscribe((res: any) => {
      if (res.success) {
        this.users = res?.data;
        this.temp = [...this.users];
        return;
      }
      this.toaster.error(res.message);
    });
    this.getAllUsers();

  }

  getAllUsers() {
    this.socketService.emit("user:all", {});
  }

  // Optional: You can add any department-related logic here if needed
  onDepartmentChange(event: Event) {
    // debugger
    const target = event.target as HTMLSelectElement;
    const DepartmentId = Number(target.value);
    if (!isNaN(this.selectedUser) && this.selectedUser !== 0) {
      const usr = { id: this.selectedUser, departmentid: DepartmentId };
      this.socketService.emit("menus:mapingListing", usr);
    } else {
      // Log invalid user selection
      console.warn('Invalid or no user selected. Clearing user list.');
      this.users = [];
    }
  }

  onUserChangeListen() {
    this.socketService.listen('menus:mapingListing').subscribe((response: any) => {
      if (response.success) {
        this.menusArray = response.data;
      } else {
        this.toaster.error(response.message)
      }
    });
  }
  onUserChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const userId = Number(target.value);
    if (!isNaN(userId) && userId !== 0) {
      const usr = { id: userId, departmentid: 0 };
      this.socketService.emit("menus:mapingListing", usr);
    } else {
      // Log invalid user selection
      console.warn('Invalid or no user selected. Clearing user list.');
      this.users = [];
    }
  }


  savePermissions() {
    if (this.selectedUser) {
      // console.log('Saving Permissions for User ID:', this.selectedUser);
      // console.log('Menu Items Permissions:', this.menuItems);
      // TODO: Implement actual API call to save permissions
      // this.permissionService.saveUserPermissions(this.selectedUser, this.menuItems);

      alert('Permissions saved successfully!');
    } else {
      alert('Please select a user first.');
    }
  }
  toggleSubMenu(menuItem: MenuItem) {
    if (menuItem.hasSubMenu) {
      menuItem.isSubMenuExpanded = !menuItem.isSubMenuExpanded;
    }
  }
  getallDepartmentListen() {
    this.socketService.listen('department:all').subscribe((res: any) => {
      if (res?.success) {
        this.departmentList = res.data;
        // console.log("departmentList", this.departmentList);

      }
    });
  }

  emitDepartmentList() {
    this.socketService.emit('department:all', {});
  }


}