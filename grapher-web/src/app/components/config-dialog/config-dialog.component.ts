import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GDiagram, GLayoutTypes } from '../../services/diagram.service';


@Component({
  selector: 'app-config-dialog',
  templateUrl: './config-dialog.component.html',
})
export class ConfigDialogComponent {
  configForm: FormGroup;
  layoutTypes = [
    GLayoutTypes.FORCE, GLayoutTypes.CIRCULAR,
    GLayoutTypes.DIGRAPH, GLayoutTypes.GRID, GLayoutTypes.TREE
  ];

  constructor(public dialogRef: MatDialogRef<ConfigDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data, private builder: FormBuilder) {
    this.configForm = builder.group({
      name: [data.diagram.name],
      url: [data.diagram.url],
      driver: [data.diagram.driver],
      layouts: builder.array([]),
      shapes: builder.array([])
    });
    this._initLayouts();
    this._initShapes();
  }

  private _initLayouts(): void {
    for (const layout of this.data.diagram.layouts) {
      this.layouts.push(this.builder.group({
        ltype: [layout.ltype],
        tip: [layout.tip]
      }));
    }
  }

  private _initShapes(): void {
    for (const shape of this.data.diagram.shapes) {
      this.shapes.push(this.builder.group({
        name: [shape.name],
        figure: [shape.figure],
        fill: [shape.fill],
        geometryString: [shape.geometryString]
      }));
    }
  }

  get layouts(): FormArray {
    return this.configForm.get('layouts') as FormArray;
  }

  get shapes(): FormArray {
    return this.configForm.get('shapes') as FormArray;
  }

  get availableLayouts(): Array<GLayoutTypes> {
    const total = this.layoutTypes;
    const used = this.layouts.controls.map(
      (x) => { const a = <FormGroup>x; return a.controls.ltype.value; }
    );
    return total.filter(x => (used.indexOf(x) < 0));
  }

  isLayoutAvailable(lt: GLayoutTypes): boolean {
    if (this.availableLayouts.indexOf(lt) >= 0) {
      return true;
    }
    return false;
  }

  addLayout(): void {
    const layout = this.availableLayouts[0];
    this.layouts.push(this.builder.group({
      ltype: [layout],
      tip: ['']
    }));
  }

  removeLayout(i: number): void {
    this.layouts.removeAt(i);
  }

  addShape(): void {
    this.shapes.push(this.builder.group({
      name: [''],
      figure: [''],
      fill: [''],
      geometryString: [''],
    }));
  }

  removeShape(i: number): void {
    this.shapes.removeAt(i);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({
      diagram: new GDiagram(this.configForm.value), index: this.data.index
    });
  }
}
