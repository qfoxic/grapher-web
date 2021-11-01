import {AfterContentInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DiagramMessageType, GDiagram, GDiagramService, GLayoutTypes} from '../../services/diagram.service';
import * as go from 'gojs';


const gomk = go.GraphObject.make;
const DEFAULT_GRID_LAYOUT_COLUMNS = 50;


export function trans(transaction_name: string) {
  return function (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) {
    let m = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
      this.diag.startTransaction(transaction_name);
      try {
        return m.apply(this, args);
      } catch (e) {
        this.diag.rollbackTransaction();
      }
      this.diag.commitTransaction(transaction_name);
    }
  }
}

@Component({
  selector: 'app-diagram',
  template: '<div #diagramDiv class="grapher-diagram-container"></div>',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent implements AfterContentInit, OnInit {
  private readonly diag: go.Diagram = new go.Diagram();
  private model: go.GraphLinksModel = new go.GraphLinksModel();

  @ViewChild('diagramDiv', {static: true}) private diagramRef: ElementRef;

  constructor(private readonly diagramService: GDiagramService) {
    this.diag.model = this.model;
    this.diag.toolManager.draggingTool.dragsTree = true;
    this.diag.initialContentAlignment = go.Spot.Center;
  }

  private static getScaleRatio(calc: number) {
    // GoJS doesn't scale diagram to 0. Function must return value greater than 0.
    // Bad values for log2 are 0 and 1. That's why we have to add 2 to avoid bad calculation for low values.
    return (calc <= 0.000001 || isNaN(calc) ) ? 1 : Math.log2(Math.log2((calc * 1000.00) + 2));
  }

  private static scalingTraverse(rootNodeIter: go.Iterator<go.Node>, propertyName: string) {
    let sum = rootNodeIter.value.data[propertyName] || 0.00;
    const childrenIter: go.Iterator<go.Node> = rootNodeIter.value.findTreeChildrenNodes();
    while (childrenIter.next()) {
      let currentNode = childrenIter.value;
      if (currentNode.isTreeLeaf) {
        const curPropValue = currentNode.data[propertyName];
        if (curPropValue) {
          sum += curPropValue;
          currentNode.scale = DiagramComponent.getScaleRatio(curPropValue);
          currentNode.data['scalingTraverseValue'] = curPropValue;
        }
      } else {
        if (currentNode.data['trVisited']) {
          return sum + currentNode.data['summaryCalc'];
        }
        currentNode.data['trVisited'] = true;
        let calc = DiagramComponent.scalingTraverse(childrenIter, propertyName);
        currentNode.data['summaryCalc'] = calc;
        sum += calc;
        currentNode.scale = DiagramComponent.getScaleRatio(calc);
        currentNode.data['scalingTraverseValue'] = calc;
      }
    }
    rootNodeIter.value.data['scalingTraverseValue'] = sum;
    return sum;
  }

  private static updateToolTip(nodeData: any) {
    return `${nodeData.key} ${nodeData.scalingTraverseValue ? nodeData.scalingTraverseValue : ''}`;
  }

  private static makeLayout(layout: string | undefined | null): go.Layout {
    switch (layout) {
      case GLayoutTypes.CIRCULAR:
        const lytc = new go.CircularLayout();
        lytc.radius = DEFAULT_GRID_LAYOUT_COLUMNS;
        return lytc;
      case GLayoutTypes.FORCE: return new go.ForceDirectedLayout();
      case GLayoutTypes.GRID:
        const lytg = new go.GridLayout();
        lytg.wrappingColumn = DEFAULT_GRID_LAYOUT_COLUMNS;
        return lytg;
      case GLayoutTypes.DIGRAPH: return new go.LayeredDigraphLayout();
      case GLayoutTypes.TREE: return new go.TreeLayout();
      default:
        const lyt = new go.GridLayout();
        lyt.wrappingColumn = DEFAULT_GRID_LAYOUT_COLUMNS;
        return lyt;
    }
  }

  private getShapeProperty(prop: string) {
    const shapesMap = this.diagramService.currentDiagram.shapesMap;
    return function (categ: string) {
      const shape = shapesMap[categ];
      return shape && shape[prop] || null;
    };
  }

  private makeNodeTemplate(diagram: go.Diagram, curD: GDiagram): void {
    diagram.nodeTemplate = gomk(go.Node, 'Horizontal',
      {
        toolTip: gomk(go.Adornment, 'Auto',
            gomk(go.Shape, { fill: '#FFFFCC' }),
            gomk(go.TextBlock, { margin: 4 }, new go.Binding(
              'text', '', DiagramComponent.updateToolTip))
        ),
        doubleClick: function(e, node: go.Node) {
          window.open(node.data.url);
        }
      },
      gomk(go.Shape, { geometryStretch: go.GraphObject.Fill },
        new go.Binding('fill', 'category', this.getShapeProperty('fill')),
        new go.Binding('figure', 'category', this.getShapeProperty('figure')),
        new go.Binding('geometryString', 'category',
          this.getShapeProperty('geometryString'))
      ),
      gomk(go.TextBlock, { overflow: go.TextBlock.WrapDesiredSize, wrap: go.TextBlock.WrapFit },
        new go.Binding('text', 'key')
      )
    );
  }

  public onDataReceived(batch: any): void {
    const first = batch[0];
    // Data are coming in batches so, it doesn't affect performance too much.
    if (first.category !== 'link') {
      this.model.addNodeDataCollection(batch);
    } else {
      this.model.addLinkDataCollection(batch);
    }
  }

  public onLayoutChanged(layout: string): void {
    this.diag.layout = DiagramComponent.makeLayout(layout);
  }

  @trans('clear')
  public onDiagramClear(): void {
    this.diag.clear();
  }

  public onFilterManyLinks(): void {
    this.diag.nodes.each(function(n) {
      const c = n.linksConnected.count;
      n.visible = (c === 0);
    });
  }

  public onFilter0Links(): void {
    this.diag.nodes.each(function(n) {
      const c = n.linksConnected.count;
      n.visible = (c >= 1);
    });
  }

  public onFilterClear(): void {
    this.diag.nodes.each(function(n) {
        n.visible = true;
    });
  }

  @trans('traverse')
  public onTraverseByProperty(propertyName: string): void {
    const nodesIter: go.Iterator<go.Node> = this.diag.findTreeRoots();
    while (nodesIter.next()) {
      const calcSum: number = DiagramComponent.scalingTraverse(nodesIter, propertyName);
      nodesIter.value.scale = DiagramComponent.getScaleRatio(calcSum);
    }
  }

  @trans('layout')
  public onMakeInitialLayout(): void {
    this.diag.layout = DiagramComponent.makeLayout(null);
  }

  ngAfterContentInit() {
    this.diag.div = this.diagramRef.nativeElement;
  }

  ngOnInit() {
    const curD = this.diagramService.currentDiagram;
    if (!curD) {
      return;
    }

    this.diag.layout = DiagramComponent.makeLayout(curD.defaultLayout);

    this.diagramService.updateDiagram$.subscribe((msg) => {
      switch (msg.changeType) {
        case DiagramMessageType.LAYOUT:
          this.onLayoutChanged(msg.data); break;
        case DiagramMessageType.CLEAR:
          this.onDiagramClear(); break;
        case DiagramMessageType.INITIAL_LAYOUT:
          this.onMakeInitialLayout(); break;
        case DiagramMessageType.FILTER_MANY_LINKS:
          this.onFilterManyLinks(); break;
        case DiagramMessageType.FILTER_0_LINKS:
          this.onFilter0Links(); break;
        case DiagramMessageType.FILTER_CLEAR:
          this.onFilterClear(); break;
        case DiagramMessageType.SOCKET_DATA:
          this.onDataReceived(msg.data); break;
        case DiagramMessageType.TRAVERSE_PROPERTY_SUM:
          this.onTraverseByProperty(msg.data); break;
        }
      });

    this.makeNodeTemplate(this.diag, curD);
  }
}
