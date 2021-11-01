import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutModule } from '@angular/cdk/layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatTooltipModule, MatButtonToggleModule, MatDialogModule,
         MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule,
         MatProgressBarModule, MatTabsModule, MatDividerModule } from '@angular/material';

import { DiagramComponent } from './components/diagram/diagram.component';
import { ConfigDialogComponent } from './components/config-dialog/config-dialog.component';


@NgModule({
  declarations: [
      AppComponent,
      DiagramComponent,
      ConfigDialogComponent
  ],
  imports: [
      BrowserModule,
      LayoutModule,
      FormsModule,
      MatButtonModule,
      MatIconModule,
      MatInputModule,
      MatSelectModule,
      MatSnackBarModule,
      MatButtonToggleModule,
      MatTooltipModule,
      MatProgressBarModule,
      MatDialogModule,
      MatTabsModule,
      ReactiveFormsModule,
      MatDividerModule,
      BrowserAnimationsModule,
      AppRoutingModule
  ],
  entryComponents: [ ConfigDialogComponent ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
