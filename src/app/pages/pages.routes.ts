import { Routes } from '@angular/router';
import { PagesComponent } from './pages.component';
import { AdminComponent } from './admin/admin.component';
import { InvoiceComponent } from '../invoice/invoice.component'


export const routes: Routes = [
    {
        path: '',
        component: PagesComponent,
        children: [
            // customer
            {
                path: 'customer',
                data: { breadcrumb: "Customer" },
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./customer/customer.component').then(c => c.CustomerComponent),
                        data: { breadcrumb: 'Customer' }
                    },
                    {
                        path: 'orders',
                        loadComponent: () => import('./customer/orders/orders.component').then(c => c.OrdersComponent),
                        data: { breadcrumb: 'Orders' }
                    },
                    {
                        path: 'profile',
                        loadComponent: () => import('./customer/profile/profile.component').then(c => c.ProfileComponent),
                        data: { breadcrumb: 'Profile' }
                    },
                    {
                        path: 'subscriptions',
                        loadComponent: () => import('./customer/subscriptions/subscriptions.component').then(c => c.SubscriptionsComponent),
                        data: { breadcrumb: 'Subscriptions' }
                    },
                ]
            },
            {
                path: 'qualitypanel',
                loadComponent: () => import('./Quality/quality-dashboard/quality-dashboard.component').then(c => c.QualityDashboardComponent),
                data: { breadcrumb: 'Quality Panel' }
            },
            {
                path: 'Invoice/:Vru_id',
                loadComponent: () => import('../invoice/invoice.component').then(c => c.InvoiceComponent),
                // data: { breadcrumb: false }
            },
            {
                path: 'view-quality-control/:id',
                loadComponent: () => import('./Quality/quality-dashboard/view-quality-control/view-quality-control.component').then(c => c.ViewQualityControlComponent),
                data: { breadcrumb: 'View' }
            },
            {
                path: "silo-info",
                loadComponent: () => import('./silo-department/silo-info/silo-info.component').then(c => c.SiloInfoComponent),
                data: { breadcrumb: "Silo Transaction" }
            },
            {
                path: 'department-inventory/:departmentId',
                loadComponent: () =>
                    import('./department-inventory/department-inventory.component').then(c => c.DepartmentInventoryComponent),
                data: { breadcrumb: 'Inventory' }
            },
            {
                path: "Silo-Department",
                loadComponent: () => import('./silo-department/silo-department.component').then(c => c.SiloDepartmentComponent),
                data: { breadcrumb: "Silo Department" }
            },
            {
                path: "edit-silos-department/:id",
                loadComponent: () => import('./silo-department/edit-silos-department/edit-silos-department.component').then(c => c.EditSilosDepartmentComponent),
                data: { breadcrumb: "Edit Silo Department" }
            },
            {
                path: 'delivery-boy',
                loadComponent: () => import('./Delivery-Boy/delivery-boy/delivery-boy.component').then(c => c.DeliveryBoyComponent),
                data: { breadcrumb: 'Delivery boy' }
            },
            {
                path: 'product-delivery-list',
                loadComponent: () => import('./Distribution-Center/product-delivery-list/product-delivery-list.component').then(c => c.ProductDeliveryListComponent),
                data: { breadcrumb: 'Product Delivery List' }
            },
            {
                path: 'Distribution-Center/customer',
                loadComponent: () => import('./Distribution-Center/customer/customer.component').then(c => c.CustomerComponent),
                data: { breadcrumb: 'Customer' }
            },
            {
                path: 'delivery-person',
                loadComponent: () => import('./Distribution-Center/delivery-person/delivery-person.component').then(c => c.DeliverypersonComponent),
                data: { breadcrumb: 'Delivery Person' }
            },
            {
                path: 'distribution-center',
                loadComponent: () => import('./Distribution-Center/distribution-center.component').then(c => c.DistributionCenterComponent),
                data: { breadcrumb: 'Distribution Center' }
            },
            {
                path: 'order',
                loadComponent: () => import('./Distribution-Center/order/order.component').then(c => c.OrderComponent),
                data: { breadcrumb: 'Order' }
            },
            {
                path: 'dispatch-to-retail/:Id',
                loadComponent: () => import('./Distribution-Center/dispatch-to-retail/dispatch-to-retail.component').then(c => c.DispatchToRetailComponent),
                data: { breadcrumb: 'Dispatch To Retail' }
            },
            {
                path: 'customer-details/:id',
                loadComponent: () => import('./Distribution-Center/customer/customer-details/customer-details.component').then(c => c.CustomerDetailsComponent),
                data: { breadcrumb: 'Customer-details' }
            },
            {
                path: 'employee-details/:id',
                loadComponent: () => import('./Distribution-Center/delivery-person/employee-detail/employee-detail.component').then(c => c.EmployeeDetailComponent),
                data: { breadcrumb: 'Employee-details' }
            },
            {
                path: 'assign-delivery',
                loadComponent: () => import('./Distribution-Center/delivery-person/assign-delivery-to-customer/assign-delivery-to-customer.component').then(c => c.AssignDeliveryToCustomerComponent),
                data: { breadcrumb: 'Assign Delivery Customer' }
            },
            {
                path: 'create-retail-user',
                loadComponent: () => import('./Distribution-Center/create-retail-user/create-retail-user.component').then(c => c.CreateRetailUserComponent),
                data: { breadcrumb: 'Create-Retail-User' }
            },
            {
                path: 'e-commerce',
                loadComponent: () => import('./E-Commerce/e-commerce/e-commerce.component').then(c => c.ECommerceComponent),
                data: { breadcrumb: 'E-Commerce' }
            },
            {
                path: 'view-user/:id',
                loadComponent: () => import('./E-Commerce/view-ecomm-user-component/view-ecomm-user-component.component').then(c => c.ViewEcommUserComponentComponent),
                data: { breadcrumb: 'View-User' }
            },
            {
                path: 'ecomm-user',
                loadComponent: () => import('./E-Commerce/e-commerce-user/e-commerce-user.component').then(c => c.ECommerceUserComponent),
                data: { breadcrumb: 'E-Commerce User' }
            },
            {
                path: 'packaging-department',
                loadComponent: () => import('./packing-department/packing-department.component').then(c => c.PackingDepartmentComponent),
                data: { breadcrumb: 'Packaging Department' }
            },
            {
                path: 'finished-packaging',
                loadComponent: () => import('./inventory/finished-packaging-inventory/finished-packaging-inventory.component').then(c => c.FinishedPackagingInventoryComponent),
                data: { breadcrumb: 'Finished Packaging' }
            },
            {
                path: 'unfinished-packaging',
                loadComponent: () => import('./inventory/unfinished-packaging-inventory/unfinished-packaging-inventory.component').then(c => c.UnfinishedPackagingInventoryComponent),
                data: { breadcrumb: 'Un-Finished Packaging' }
            },
            {
                path: "edit-packing-department/:Id",
                loadComponent: () => import('./packing-department/edit-packing-department/edit-packing-department.component').then(c => c.EditPackingDepartmentComponent),
                data: { breadcrumb: "Edit Packing Department" }
            },
            {
                path: "packing-process",
                loadComponent: () => import('./packing-department/packing-process/packing-process.component').then(c => c.PackingProcessComponent),
                data: { breadcrumb: "Packing Process" }
            },
            // {
            //     path: 'product-department',
            //     loadComponent: () => import('./Product-Department/product-department/product-department.component').then(c => c.ProductDepartmentComponent),
            //     data: { breadcrumb: 'Product Department' }
            // },
            {
                path: 'regular-customers',
                loadComponent: () => import('./Regular-Customers/regular-customers/regular-customers.component').then(c => c.RegularCustomersComponent),
                data: { breadcrumb: 'Regular Customers' }
            },
            {
                path: 'retail-customers',
                loadComponent: () => import('./Retail-Customers/retail-customers/retail-customers.component').then(c => c.RetailCustomersComponent),
                data: { breadcrumb: 'Retail Customers' }
            },
            {
                path: 'retail-shops',
                loadComponent: () => import('./Retail-Shops/retail-shops/retail-shops.component').then(c => c.RetailShopsComponent),
                data: { breadcrumb: 'Retail Shops' }
            },
            {
                path: 'stock-department',
                loadComponent: () => import('./Stock-Department/stock-department/stock-department.component').then(c => c.StockDepartmentComponent),
                data: { breadcrumb: 'Stock Department' }
            },
            {
                path: 'send-quantity',
                loadComponent: () => import('./Stock-Department/send-quantity/send-quantity.component').then(c => c.SendQuantityComponent),
                data: { breadcrumb: 'Send Quantity' }
            },
            {
                path: 'send-quantity/:Id',
                loadComponent: () => import('./Stock-Department/send-quantity/send-quantity.component').then(c => c.SendQuantityComponent),
                data: { breadcrumb: 'Send Quantity' }
            },
            // {
            //     path: 'Inventory',
            //     loadComponent: () => import('./inventory/inventory.component').then(c => c.InventoryComponent),
            //     data: { breadcrumb: 'Inventory' }
            // },
            {
                path: 'inventory/:departmentName',
                loadComponent: () =>
                    import('./inventory/inventory.component').then(c => c.InventoryComponent),
                data: { breadcrumb: 'Inventory' }
            },
            {
                path: "send-return-distribution-center",
                loadComponent: () => import('./Stock-Department/send-return-distribution-center/send-return-distribution-center.component').then(c => c.SendReturnDistributioncenterComponent),
                data: { breadcrumb: "Distribution Center" }
            },


            {
                path: "inventory-department",
                loadComponent: () => import('./inventory-department/inventory-department.component').then(c => c.InventoryDepartmentComponent),
                data: { breadcrumb: "Inventory-Department" }
            },


            // admin routes
            {
                path: 'admin',
                data: { breadcrumb: 'Admin' },
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./admin/admin.component').then(c => c.AdminComponent),
                        data: { breadcrumb: 'admin' }
                    },
                    {
                        path: "users",
                        loadComponent: () => import('./admin/users/users.component').then(c => c.UsersComponent),
                        data: { breadcrumb: "users" }
                    },
                    // tools routes
                    {
                        path: "tools",
                        data: { breadcrumb: "Tools" },
                        children: [
                            {
                                path: "",
                                loadComponent: () => import('./admin/tools/tools.component').then(c => c.ToolsComponent),
                                data: { breadcrumb: "Tools" }
                            },
                            {
                                path: "create-menus",
                                loadComponent: () => import('./admin/tools/menus/menus.component').then(c => c.MenusComponent),
                                data: { breadcrumb: "Menu" }
                            },
                            {
                                path: "user-menu-mapping",
                                loadComponent: () => import('./admin/tools/user-menu-mapping/user-menu-mapping.component').then(c => c.UserMenuMappingComponent),
                                data: { breadcrumb: "Assign Menu to User" }
                            },
                            {
                                path: "department",
                                loadComponent: () => import('./admin/tools/department/department.component').then(c => c.DepartmentComponent),
                                data: { breadcrumb: "Department" },
                            },
                            // products departmen created by pankaj 
                            {
                                path: "products",
                                loadComponent: () => import('./admin/tools/products/products.component').then(c => c.ProductsComponent),
                                data: { breadcrumb: "Products" }
                            },
                            {
                                path: "alerttype",
                                loadComponent: () => import('./admin/tools/master-alerttype/master-alerttype.component').then(c => c.MasterAlerttypeComponent),
                                data: { breadcrumb: "Alerttype" }
                            },
                            {
                                path: "products",
                                loadComponent: () => import('./admin/tools/products/products.component').then(c => c.ProductsComponent),
                                data: { breadcrumb: "Products" }
                            },
                            {
                                path: "approval-status",
                                loadComponent: () => import('./admin/tools/master-approval-status/master-approval-status.component').then(c => c.MasterApprovalStatusComponent),
                                data: { breadcrumb: "Approval-status" }
                            },
                            {
                                path: "cities",
                                loadComponent: () => import('./admin/tools/master-cities/master-cities.component').then(c => c.MasterCitiesComponent),
                                data: { breadcrumb: "Cities" }
                            },
                            {
                                path: "condition",
                                loadComponent: () => import('./admin/tools/master-condition/master-condition.component').then(c => c.MasterConditionComponent),
                                data: { breadcrumb: "Condition" }
                            },
                            {
                                path: "devicetype",
                                loadComponent: () => import('./admin/tools/master-devicetype/master-devicetype.component').then(c => c.MasterDevicetypeComponent),
                                data: { breadcrumb: "Devicetype" }
                            },
                            {
                                path: "entrytype",
                                loadComponent: () => import('./admin/tools/master-entrytype/master-entrytype.component').then(c => c.MasterEntrytypeComponent),
                                data: { breadcrumb: "Entrytype" }
                            },
                            {
                                path: "pasteurization-silos",
                                loadComponent: () => import('./admin/tools/master-pasteurization-silos/master-pasteurization-silos.component').then(c => c.MasterPasteurizationSilosComponent),
                                data: { breadcrumb: "Pasteurization-silos" }
                            },
                            {
                                path: "payment-status",
                                loadComponent: () => import('./admin/tools/master-payment-status/master-payment-status.component').then(c => c.MasterPaymentStatusComponent),
                                data: { breadcrumb: "Payment-status" }
                            },
                            {
                                path: "paymenttype",
                                loadComponent: () => import('./admin/tools/master-paymenttype/master-paymenttype.component').then(c => c.MasterPaymenttypeComponent),
                                data: { breadcrumb: "Paymenttype" }
                            },
                            // {
                            //     path: "shift",
                            //     loadComponent: () => import('./admin/tools/master-shift/master-shift.component').then(c => c.MasterShiftComponent),
                            //     data: { breadcrumb: "Shift" }
                            // },
                            {
                                path: "units",
                                loadComponent: () => import('./admin/tools/master-units/master-units.component').then(c => c.MasterUnitsComponent),
                                data: { breadcrumb: "Units" }
                            },
                            {
                                path: "userrole",
                                loadComponent: () => import('./admin/tools/master-userrole/master-userrole.component').then(c => c.MasterUserroleComponent),
                                data: { breadcrumb: "Userrole" }
                            },
                            {
                                path: 'master-silos',
                                loadComponent: () => import('./admin/tools/master-silos/master-silos.component').then(c => c.MasterSilosComponent),
                                data: { breadcrumb: "Master Silos" }
                            },
                            {
                                path: "distribution-center",
                                loadComponent: () => import('./admin/tools/master-distribution-center/master-distribution-center.component').then(c => c.MasterDistributionCenterComponent),
                                data: { breadcrumb: "Master Distribution Center" }
                            },
                            {
                                path: "packaging-size",
                                loadComponent: () => import('./admin/tools/master-packaging-size/master-packaging-size.component').then(c => c.MasterPackagingUnitComponent),
                                data: { breadcrumb: "Packaging Size" }
                            },
                            {
                                path: "product-type",
                                loadComponent: () => import('./admin/tools/master-producttype/master-producttype.component').then(c => c.MasterProducttypeComponent),
                                data: { breadcrumb: "Product Type" }
                            },
                            {
                                path: "vendor-product-price",
                                loadComponent: () => import('./admin/tools/vendor-product-price/vendor-product-price.component').then(c => c.VendorProductPriceComponent),
                                data: { breadcrumb: "Vendor Product Price" }
                            },
                            {
                                path: "assign-product-to-vendor",
                                loadComponent: () => import('./admin/tools/assign-product-to-vendor/assign-product-to-vendor.component').then(c => c.AssignProductToVendorComponent),
                                data: { breadcrumb: "Assign Product to vendor" }
                            },
                        ]
                    },
                    // admin-approval========
                    {
                        path: 'approval-list',
                        loadComponent: () => import('./admin/Admin-Approval/approvals-list/approvals-list.component').then(c => c.ApprovalsListComponent),
                        data: { breadcrumb: "Approval List" }
                    },
                    {
                        path: 'admin-approval/:Id',
                        loadComponent: () => import('./admin/Admin-Approval/admin-approval-details/admin-approval-details.component').then(c => c.AdminApprovalDetailsComponent),
                        data: { breadcrumb: "Admin Approval" }
                    },
                    // other department
                    {
                        path: 'other-department',
                        loadComponent: () => import('./admin/Department/other-department/other-department.component').then(c => c.OtherDepartmentComponent),
                        data: { breadcrumb: "Other Department" }
                    }
                ]
            }
            ,
            // other department
            {
                path: 'department/:departmentId',
                loadComponent: () => import('./admin/Department/other-department/other-department.component').then(c => c.OtherDepartmentComponent),
                data: { breadcrumb: "Other Department" }
            },
            {
                path: 'approvals/:Id',
                loadComponent: () => import('./qualityplant_manager/quality-manager-dashboard/update-approval-details/update-approval-details.component').then(c => c.UpdateApprovalDetailsComponent),
                data: { breadcrumb: 'Approval Details' }
            },
            // 'pasteurization-department'
            {
                path: 'pasteurization',
                loadComponent: () => import('./pasteurization-department/pasteurization-department.component').then(c => c.PasteurizationDepartmentComponent),
                data: { breadcrumb: 'Pasteurization Department' }
            },
            {
                path: "pasteurization-silo/:id",
                loadComponent: () => import('./pasteurization-department/pasteurization-silo/pasteurization-silo.component').then(c => c.PasteurizationSiloComponent),
                data: { breadcrumb: "Pasteurization-Silo" }
            },
            {
                path: "pasteurization-silo-info",
                loadComponent: () => import('./pasteurization-department/pastrz-silo-info/pastrz-silo-info.component').then(c => c.PastrzSiloInfoComponent),
                data: { breadcrumb: "Pasteurization Silo Info" }
            },
            {
                path: 'ui',
                loadChildren: () => import('./ui/ui.routes').then(p => p.routes),
                data: { breadcrumb: 'UI' }
            },
            {
                path: 'dynamic-menu',
                loadComponent: () => import('./dynamic-menu/dynamic-menu.component').then(c => c.DynamicMenuComponent),
                data: { breadcrumb: 'Dynamic Menu' }
            },
            {
                path: 'users',
                loadComponent: () => import('./admin/users/users.component').then(c => c.UsersComponent),
                data: { breadcrumb: 'User' }
            },
            {
                path: 'vendor-dashboard',
                loadComponent: () => import('./Vendor/vendor-dashboard/vendor-dashboard.component').then(c => c.VendorDashboardComponent),
                data: { breadcrumb: 'Vendor' }
            },
            {
                path: 'vendor-payment',
                loadComponent: () => import('./Vendor/vendor-payment/vendor-payment.component').then(c => c.VendorPaymentComponent),
                data: { breadcrumb: 'Vendor Payments' }
            },
            {
                path: 'vendor-reports',
                loadComponent: () => import('./Vendor/vendor-reports/vendor-reports.component').then(c => c.VendorReportsComponent),
                data: { breadcrumb: 'Vendor Reports' }
            },
            {
                path: 'vendor-Details-view/:id',
                loadComponent: () => import('./Vendor/vendor-dashboard/viewfulldetailsmyentry/viewfulldetailsmyentry.component').then(c => c.ViewfulldetailsmyentryComponent),
                data: { breadcrumb: 'Vendor Details View' }
            },
            {
                path: 'qualitymanagerdashboard',
                loadComponent: () => import('./qualityplant_manager/quality-manager-dashboard/quality-manager-dashboard.component').then(c => c.QualityManagerdashboardComponent),
                data: { breadcrumb: 'Dashboard' }
            },
            {
                path: 'alertdetails',
                loadComponent: () => import('../theme/components/messages/alert-details/alert-details.component').then(c => c.AlertDetailsComponent),
                data: { breadcrumb: 'Alert Message Details' }
            },
            {
                path: 'form-elements',
                loadChildren: () => import('./form-elements/form-elements.routes').then(p => p.routes),
                data: { breadcrumb: 'Form Elements' }
            }
        ]
    }
];

