import * as d3 from "d3";
import { HierarchyPointNode, LinkRadial } from "d3";
import { HierarchyLink } from "d3-hierarchy";

export const ANIMATION_DURATION = 500;
const SWG_WIDTH = 360;
const SWG_HEIGHT = 360;

type TreeInput = { id: string; main?: boolean; children?: TreeInput[] };
interface ChartData {
  x: number;
  y: number;
}

export interface SymbolOnLineData {
  lineId: string;
  symbol: string;
  color: string;
  timeout: number;
  isReverse?: boolean;
  wentPart?: number;
}

export const createRadialTree = (input: TreeInput, element: HTMLDivElement) => {
  d3.select(element).html("");

  const svg = d3.select(element).append("svg").attr("width", SWG_WIDTH).attr("height", SWG_HEIGHT);

  const diameter = SWG_HEIGHT * 0.75;
  const radius = diameter / 2;

  const tree = d3
    .tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const data = d3.hierarchy(input);
  const treeData = tree(data as any);
  const nodes = treeData.descendants();
  const links = treeData.links();

  const graphGroup = svg
    .append("g")
    .attr("transform", "translate(" + SWG_WIDTH / 2 + "," + SWG_HEIGHT / 2 + ")");

  graphGroup
    .selectAll(".link")
    .data(links)
    .join("path")
    .attr("class", "link")
    .attr("style", "fill: none; stroke: #ccc; stroke-width: 1.5px;")
    .attr(
      "d",
      (d3.linkRadial() as LinkRadial<any, any, any>)
        .angle((d: ChartData) => d.x)
        .radius((d: ChartData) => d.y)
    );

  const node = graphGroup
    .selectAll(".node")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => `rotate(${(d.x * 180) / Math.PI - 90})` + `translate(${d.y}, 0)`);

  node.append("circle").attr("r", 1);

  node
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("dx", (d) => {
      const node = d as HierarchyPointNode<TreeInput>;
      return node.data.main ? (d.x < Math.PI ? -18 : 18) : d.x < Math.PI ? 8 : -8;
    })
    .attr("dy", (d) => {
      const node = d as HierarchyPointNode<TreeInput>;
      return node.data.main ? "0" : ".31em";
    })
    .attr("text-anchor", (d) => {
      return d.x < Math.PI ? "start" : "end";
    })
    .attr("transform", (d) => {
      const node = d as HierarchyPointNode<TreeInput>;
      return node.data.main ? "rotate(-90)" : d.x < Math.PI ? null : "rotate(180)";
    })
    .text((d) => {
      const node = d as HierarchyPointNode<TreeInput>;
      return node.data.id;
    });
};

export const drawSymbolOnLine = (element: HTMLDivElement, symbolData: SymbolOnLineData) => {
  const shift = symbolData.wentPart || 0;

  const translateStatus = (node: d3.BaseType, isReverse?: boolean) => {
    const element = node as SVGGeometryElement;
    const totalLength = element.getTotalLength();
    const getPoints = (t: number) => {
      return isReverse ? 1 - shift - t * (1 - shift) : shift + t * (1 - shift);
    };
    return () => (t: number) => {
      const p = element.getPointAtLength(getPoints(t) * totalLength);
      return "translate(" + p.x + "," + p.y + ")";
    };
  };

  const { lineId, symbol, color, isReverse } = symbolData;
  const svg = d3.select(element).select("svg");
  const lines = d3.select(element).selectAll(".link");
  const line = lines.filter((line) => (line as HierarchyLink<TreeInput>).target.data.id === lineId);

  if (!line.node()) return;

  const status = svg
    .append("text")
    .attr("r", 5)
    .attr("dx", SWG_WIDTH / 2 - 5)
    .attr("dy", SWG_HEIGHT / 2 + 5)
    .attr("fill", color)
    .text(symbol);

  status
    .transition()
    .ease(d3.easeLinear)
    .duration(ANIMATION_DURATION * (1 - shift))
    .attrTween("transform", translateStatus(line.node(), isReverse))
    .on("end", () => {
      status.remove();
    });
};
