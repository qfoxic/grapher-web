import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { GBackendService, StatusMessageType } from './services/backend.service';
import { GDiagramService } from './services/diagram.service';
import { ConfigDialogComponent } from './components/config-dialog/config-dialog.component';


const PROGRESS_DETERMINATE = 'determinate';
const PROGRESS_INDETERMINATE = 'indeterminate';


class CallHooksService {
  private readonly backendService: GBackendService;
  private readonly diagramService: GDiagramService;
  private callsMapping: Map<string, string> = new Map();

  constructor(bs: GBackendService, ds: GDiagramService) {
    this.callsMapping['backend_config'] = this.config.bind(this);
    this.callsMapping['traverse'] = 'traversePropertySum';
    this.backendService = bs;
    this.diagramService = ds;
  }

  public processBackendResponse(message: any): void {
    let methodName: string = 'backend_' + message.name;
    if (this.contains(methodName)) {
      this.callsMapping[methodName](message.data);
    }
  }

  public resolve(inputCommand: string): [string, Array<string>]|undefined {
    const methodData: Array<string> = inputCommand.trim().split(' ');
    const methodName: string = methodData.shift();
    const resolvedMethod = this.callsMapping[methodName];

    if (resolvedMethod) {
      return [resolvedMethod, methodData];
    }
  }

  public contains(inputCommand: string): boolean {
    return inputCommand in this.callsMapping;
  }

  public config(data: any): void {
    let curId = this.diagramService.currentDiagramId;
    let diagram = this.diagramService.createDiagramFrom(data);
    this.diagramService.updateDiagram(curId, diagram);
  }

  public callDiagramMethod(data: [string, Array<string>]): void {
    this.diagramService[data[0]](...data[1]);
  }
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy, OnInit {
  private bs: Subscription;
  private callHooks: CallHooksService;

  public progressMode: 'determinate' | 'indeterminate';

  constructor(public snackBar: MatSnackBar, public configDialog: MatDialog,
              private backendService: GBackendService,
              public diagramService: GDiagramService) {
    this.callHooks = new CallHooksService(backendService, diagramService);
    this.initProgress();
  }

  public initProgress() {
    this.progressMode = PROGRESS_DETERMINATE;
  }

  public startProgress() {
    this.progressMode = PROGRESS_INDETERMINATE;
  }

  public stopProgress() {
    this.progressMode = PROGRESS_DETERMINATE;
  }

  public showSnackBar(msg: string, duration: number, mtype: string) {
    this.snackBar.open(msg, '', { duration: duration, panelClass: mtype});
  }

  public createDiagram(): void {
    this.diagramService.currentDiagramId = this.diagramService.makeDefaultDiagram();
    let name = this.diagramService.currentDiagram.name;
    this.showSnackBar(`Created new diagram ${name}`, 1000, StatusMessageType.INFO);
  }

  public deleteDiagram(): void {
    if (!this.diagramService.diagrams) {
      this.showSnackBar(`No diagrams found`, 1000, StatusMessageType.ERROR);
      return
    }

    let name = this.diagramService.currentDiagram.name;
    this.diagramService.deleteDiagram(this.diagramService.currentDiagramId);
    this.diagramService.currentDiagramId = 0;
    this.showSnackBar(`Removed diagram ${name}`, 1000, StatusMessageType.INFO);
  }

  public updateDiagram(): void {
    if (!this.diagramService.diagrams) {
      this.showSnackBar(`No diagrams found`, 1000, StatusMessageType.ERROR);
      return
    }

    const dialogRef = this.configDialog.open(ConfigDialogComponent, {
      data: { diagram: this.diagramService.currentDiagram,
              index: this.diagramService.currentDiagramId }
    });
    dialogRef.afterClosed().subscribe(data => {
      if (data && data.index >= 0) {
        this.diagramService.updateDiagram(data.index, data.diagram);
      }
    });
  }

  public execCmd(cmd: string) {
    const data: [string, Array<string>] = this.callHooks.resolve(cmd);

    if (data) {
      this.startProgress();
      this.callHooks.callDiagramMethod(data);
      this.stopProgress();
    } else {
      this.startProgress();
      this.backendService.exec(cmd);
    }
  }

  ngOnInit() {
    const curD = this.diagramService.currentDiagram;

    this.backendService.init(curD.url);
    this.backendService.exec(`load ${curD.driver}`);

    this.bs = this.backendService.statusUpdater$.subscribe(
      msg => {
        switch (msg.mtype) {
          case StatusMessageType.COMMAND_DONE:  this.stopProgress(); break;
          case StatusMessageType.ERROR: this.showSnackBar(msg.data, 3000, StatusMessageType.ERROR); break;
          case StatusMessageType.INFO: this.showSnackBar(msg.data, 3000, StatusMessageType.INFO); break;
          case StatusMessageType.SERVICE: this.callHooks.processBackendResponse(msg.data); break;
          case StatusMessageType.DATA: this.diagramService.socketData(msg.data); break;
          default: break;
        }
      }
    );
  }

  ngOnDestroy() {
    this.bs.unsubscribe();
    this.backendService.close();
  }
}
