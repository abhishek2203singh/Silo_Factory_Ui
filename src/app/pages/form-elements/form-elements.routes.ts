import { Routes } from "@angular/router";
import { ControlsComponent } from "./controls/controls.component";
import { LayoutsComponent } from "./layouts/layouts.component";
import { WizardComponent } from "./wizard/wizard.component";
import { EditorComponent } from "./editor/editor.component";

export const routes: Routes = [
    { path: '', redirectTo: 'controls', pathMatch: 'full' },
    { path: 'controls', component: ControlsComponent, data: { breadcrumb: 'Form Controls' } },
    { path: 'layouts', component: LayoutsComponent, data: { breadcrumb: 'Layouts' } },
    { path: 'wizard', component: WizardComponent, data: { breadcrumb: 'Wizard' } },
    { path: 'editor', component: EditorComponent, data: { breadcrumb: 'Editor' } }
];