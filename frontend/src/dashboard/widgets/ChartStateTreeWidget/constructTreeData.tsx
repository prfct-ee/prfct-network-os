import { TreeData } from "../../d3/collapsibleTree";
import { Router } from "../../../network/idfs/IDFS";

export type RouterData = Router & {
  hexid: string;
  isAnimated: boolean;
  isCollapsed: boolean;
};
export type RoutersData = Record<string, RouterData>;

export const constructTreeData = (
  routersData: RoutersData,
  routerPosition: string,
  routerHexId: string,
  lostRouters: string[]
): { treeData: TreeData; affectedRouters: RoutersData } => {
  const affectedRouters: RoutersData = {};

  const constructData = (
    routers: RoutersData,
    position: string,
    hexId: string,
    shouldBeAnimated = false,
    shouldBeCollapsed = false
  ): TreeData => {
    const router: RouterData = routers[position];

    const layer = router?.layer || +position.slice(0, position.indexOf("/"));
    const shift = router?.shift || +position.slice(position.indexOf("/") + 1);
    const children = Object.entries(router?.routers || {}).map(([position, hexId]) =>
      constructData(
        routers,
        position,
        hexId,
        router?.isAnimated || shouldBeAnimated,
        router?.isCollapsed || shouldBeCollapsed
      )
    );

    router && (affectedRouters[position] = router);
    return {
      name: hexId.slice(0, 6),
      elements: router?.stateElements.map((el) => el.hexId.slice(0, 3)) || [],
      id: hexId,
      layer,
      shift: shift,
      position: `${layer}/${shift}`,
      isCollapsed: router?.isCollapsed || shouldBeCollapsed,
      animation:
        router?.isAnimated || shouldBeAnimated
          ? router?.isCollapsed || shouldBeCollapsed
            ? "close"
            : "open"
          : undefined,
      isLost: lostRouters.indexOf(hexId) >= 0,
      children: children?.length ? children : undefined,
    };
  };

  return { treeData: constructData(routersData, routerPosition, routerHexId), affectedRouters };
};
