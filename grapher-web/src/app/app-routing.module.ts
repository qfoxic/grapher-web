import { NgModule, APP_INITIALIZER } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { GDiagramService } from './services/diagram.service';


let diagramFactory = (ds: GDiagramService) => {
    return () => !(ds.diagrams) && ds.makeDefaultDiagram();
};


const routes: Routes = [
    { path: '', component: AppComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: APP_INITIALIZER, useFactory: diagramFactory, deps: [GDiagramService], multi: true }
  ]
})
export class AppRoutingModule { }
