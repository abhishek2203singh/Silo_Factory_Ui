import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',  // Redirect to login by default
        pathMatch: 'full'
    },

    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(c => c.LoginComponent),
    },
    {
        path: 'change-password',
        loadComponent: () => import('./pages/change-password/change-password.component').then(c => c.ChangePasswordComponent),
    },
    {
        path: 'pages',
        loadChildren: () => import('./pages/pages.routes').then(p => p.routes) // Lazy-load the pages module
    },
    {
        path: '**',
        loadComponent: () => import('./pages/errors/not-found/not-found.component').then(c => c.NotFoundComponent)
    }
];

@NgModule({
    imports: [
        BrowserModule,
        RouterModule.forRoot(routes, { useHash: true })  // Enable hash-based routing
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy }  // Use HashLocationStrategy
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
