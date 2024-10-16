import * as d3 from "d3";
import { HierarchyPointNode } from "d3";

export type AnimationDirection = "open" | "close";

const colors = {
  lost: "#ef4444",
  light: "#cdcdcd",
  common: "#000000",
  opened: "#1D4ED8",
};

export interface TreeTransform {
  scale: number;
  x: number;
  y: number;
}

export interface TreeData {
  name: string;
  elements: string[];
  id: string;
  layer: number;
  shift: number;
  position: string;
  animation?: AnimationDirection;
  isCollapsed?: boolean;
  isLost?: boolean;
  children?: TreeData[];
}
type TreeNode = d3.HierarchyRectangularNode<TreeData> & { x: number; y: number };
type PointNode = d3.HierarchyPointNode<TreeData> & { x0: number; y0: number };

const ANIMATION_DURATION = 500;

// Set the dimensions and margins of the diagram
const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const width = 360 - margin.left - margin.right;
const height = 360 - margin.top - margin.bottom;

let rootX = margin.top;
let rootY = margin.right;
let rootK = 1;

const getVisibleNodes = (nodeEnter: d3.HierarchyPointNode<unknown>[]) => {
  const visibleNodesPositions = nodeEnter
    .filter((node) => {
      const relativeX = node.y + rootX;
      const relativeY = node.x + rootY;
      const isXVisible = relativeX >= 0 && relativeX <= width;
      const isYVisible = relativeY >= 0 && relativeY <= height;
      return isXVisible && isYVisible;
    })
    .map((node) => node.data as TreeData);
  return visibleNodesPositions;
};

const calculateColor = (node: HierarchyPointNode<unknown>) => {
  return (node as PointNode).data.isLost
    ? colors.lost
    : (node as PointNode).data.isCollapsed || !(node as PointNode).data.children
    ? colors.common
    : colors.opened;
};

// declares a tree layout and assigns the size
const treemap = d3.tree().size([height, width]);

const creteHierarchy = (collapsedTreeData: TreeData) => {
  return d3.hierarchy(collapsedTreeData, (node: TreeData) => node.children) as TreeNode;
};

export const getHierarchy = (collapsedTreeData: TreeData) => creteHierarchy(collapsedTreeData);

const calculateAnimation = (node: HierarchyPointNode<unknown>) => {
  const enableAnimation = (node.parent as PointNode)?.data?.animation;
  return enableAnimation ? ANIMATION_DURATION : 0;
};

const getStartOpacity = (pointNode: HierarchyPointNode<unknown>) => {
  const node = pointNode.parent as PointNode;
  if (!node) {
    return 1;
  }
  if (node.data.animation == "open") {
    return 0;
  } else if (node.data.animation == "close") {
    return 1;
  }
  return node.data.isCollapsed ? 0 : 1;
};

const getFinalOpacity = (pointNode: HierarchyPointNode<unknown>) => {
  const node = pointNode.parent as PointNode;
  if (!node) {
    return 1;
  }
  if (node.data.animation == "open") {
    return 1;
  } else if (node.data.animation == "close") {
    return 0;
  }
  return node.data.isCollapsed ? 0 : 1;
};

const getShiftFromNoAnimatedParent = (pointNode: any, shift = 0): number => {
  const node = (pointNode as PointNode).parent;
  if (!node || !node.data.animation) {
    return shift;
  } else {
    return getShiftFromNoAnimatedParent(node, shift + 1);
  }
};

const calculateDelay = (pointNode: HierarchyPointNode<unknown>) => {
  const deltaShift = getShiftFromNoAnimatedParent(pointNode, 0);
  return ANIMATION_DURATION * (deltaShift > 0 ? deltaShift - 1 : 0);
};

export const updateTree = (
  root: any,
  source: TreeNode | PointNode,
  element: HTMLDivElement,
  onRouterClick: (hexId: string) => void,
  onRouterVisible: (hexIds: TreeData[]) => void
) => {
  // Assigns the x and y position for the nodes
  const treeData = treemap(root);

  // Compute the new tree layout.
  const nodes = treeData.descendants();
  const links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach((node) => {
    return (node.y = node.depth * 150);
  });

  // ****************** Nodes section ***************************

  // Toggle children on click.
  const click = (treeNode: TreeNode, pointNode: d3.HierarchyPointNode<unknown>) => {
    const node = pointNode as any;
    if (node.parent?.data.isCollapsed) {
      click(treeNode, node.parent);
    } else {
      const nodeData = node.data as TreeData;
      onRouterClick(nodeData.position);
    }
  };

  // Update the nodes...
  const svg = d3.select(element).select("svg > g") as d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  >;
  const gNode = svg.selectAll("g.node") as d3.Selection<
    SVGGElement,
    unknown,
    SVGGElement,
    undefined
  >;
  const node = gNode.data(nodes, (treeNode) => (treeNode as TreeNode).data.id);
  // Update the nodes...
  // Enter any new modes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (node) => {
      const parent = (node as PointNode).parent;
      if (parent?.data.animation !== "close") {
        return "translate(" + (parent?.y || node.y) + "," + (parent?.x || node.x) + ")";
      } else {
        return "translate(" + node.y + "," + node.x + ")";
      }
    })
    .style("opacity", getStartOpacity)
    .on("click", click);

  // Add Circle for the nodes
  nodeEnter.append("circle").attr("class", "node").attr("r", 1e-6).style("fill", calculateColor);

  // Add labels for the nodes
  nodeEnter
    .append("text")
    .attr("dy", 0)
    .attr("font-size", 12)
    .attr("x", 8)
    .text((node) => (node as PointNode).data.name);

  // Add labels for the nodes
  nodeEnter
    .append("text")
    .attr("dy", 8)
    .attr("font-size", 8)
    .attr("font-weight", 700)
    .attr("color", colors.light)
    .attr("x", 8)
    .text((node) => (node as PointNode).data.elements.join("|") || "-");

  const nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate
    .transition()
    .duration(calculateAnimation)
    .delay(calculateDelay)
    .style("opacity", getFinalOpacity)
    .attr("transform", (node) => {
      const parent = (node as PointNode).parent;
      if (parent?.data.animation !== "close") {
        return "translate(" + node.y + "," + node.x + ")";
      } else {
        return "translate(" + (parent?.y || source.y) + "," + (parent?.x || source.x) + ")";
      }
    });

  // Update the node attributes and style
  nodeUpdate
    .select("circle.node")
    .attr("r", 4)
    .style("fill", calculateColor)
    .attr("cursor", "pointer");

  // ****************** links section ***************************

  // Creates a curved (diagonal) path from parent to the child nodes
  const diagonal = (s: { x: number; y: number }, d: { x: number; y: number }) => {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
  };

  // Update the links...
  const pathLink = svg.selectAll("path.link") as d3.Selection<
    SVGPathElement,
    HierarchyPointNode<unknown>,
    SVGGElement,
    unknown
  >;
  const link = pathLink.data(links, (node) => (node as PointNode).data.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .insert("path", "g")
    .attr("class", "link")
    .attr("style", `fill: none; stroke: ${colors.light}; stroke-width: 1.5px;opacity:0;`)
    .attr("d", (node) => {
      const parent = (node as PointNode).parent;
      if (parent?.data.animation !== "close") {
        const o = { x: parent?.x || source.x, y: parent?.y || source.y };
        return diagonal(o, o);
      } else {
        return diagonal(node, (node as PointNode).parent || node);
      }
    });

  const linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate
    .transition()
    .duration(calculateAnimation)
    .delay(calculateDelay)
    .style("opacity", getFinalOpacity)
    .attr("d", (node) => {
      const parent = (node as PointNode).parent;
      if (parent?.data.animation !== "close") {
        return diagonal(node, (node as PointNode).parent || node);
      } else {
        const o = { x: parent?.x || source.x, y: parent?.y || source.y };
        return diagonal(o, o);
      }
    });

  onRouterVisible(getVisibleNodes(nodeEnter.data()));
};

export const createCollapsibleTree = (
  root: TreeNode,
  element: HTMLDivElement,
  onRouterClick: (hexId: string) => void,
  onRouterVisible: (hexIds: TreeData[], isAnimated?: boolean) => void,
  transform: TreeTransform,
  onTransForm: (treeTransfrom: TreeTransform) => void
) => {
  rootK = transform.scale;
  rootX = transform.x;
  rootY = transform.y;

  d3.select(element).html("");

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  const svg = d3
    .select(element)
    .append("svg")
    // .attr("width", width + margin.right + margin.left)
    // .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", [0, 0, width, height])
    .attr("transform", `scale(${rootK})`);
  const g = svg
    .append("g")
    .attr("style", "width: 100%; height: 100%")
    .attr("class", "main")
    .attr("transform", "translate(" + rootX + "," + rootY + ")")
    .attr("cursor", "grab");

  svg.call(
    (d3.drag() as d3.DragBehavior<SVGSVGElement, unknown, unknown>)
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );

  svg.call(
    (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([1, 8])
      .on("zoom", zooming)
      .on("end", zoomed)
  );

  updateTree(root, root, element, onRouterClick, onRouterVisible);

  function zooming({ transform }: { transform: { k: number; x: number; y: number } }) {
    rootK = transform.k;
    svg.attr("transform", `scale(${rootK})`);
  }

  function zoomed() {
    onTransForm({ scale: rootK, x: rootX, y: rootY });
  }

  function dragstarted() {
    g.attr("cursor", "grabbing");
  }

  function dragged(event: { dx: number; dy: number }) {
    const newX = rootX + event.dx;
    const newY = rootY + event.dy;
    rootX = newX;
    rootY = newY;
    svg.select("g.main").attr("transform", "translate(" + newX + "," + newY + ")");
  }

  function dragended() {
    const data = d3.select(element).selectAll("g.node").data() as HierarchyPointNode<unknown>[];
    const nodes = getVisibleNodes(data);
    onRouterVisible(nodes, true);
    g.attr("cursor", "grab");
    onTransForm({ scale: rootK, x: rootX, y: rootY });
  }
};
