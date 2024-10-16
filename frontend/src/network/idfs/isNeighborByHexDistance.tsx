import { getState } from "../state";
import { getHexPosition, maxPositionValue, myHexid } from "../crypto/crypto";

interface SendPosition {
  start: number;
  end: number;
}

export const isNeighborByHexDistance = (peerHexId: string, dataHash: string) => {
  const positions: SendPosition[] = [];
  const { peersChildren } = getState();
  const itemPosition = getHexPosition(dataHash);
  const allChildren = peersChildren[peerHexId];
  if (!allChildren) {
    return false;
  }
  const myPosition = allChildren.sort().indexOf(myHexid());
  const positionLength = maxPositionValue / allChildren.length;
  const mainStartPosition = maxPositionValue * (myPosition / allChildren.length);
  const mainEndPosition = mainStartPosition + positionLength;

  // add main position
  positions.push({
    start: mainStartPosition,
    end: mainEndPosition,
  });

  // add extra position before or form the end
  positions.push(
    mainStartPosition - positionLength >= 0
      ? { start: mainStartPosition - positionLength, end: mainStartPosition }
      : { start: maxPositionValue - positionLength, end: maxPositionValue }
  );

  // add extra position after or from the start
  positions.push(
    mainEndPosition + positionLength <= maxPositionValue
      ? { start: mainEndPosition, end: mainEndPosition + positionLength }
      : { start: 0, end: positionLength }
  );

  return positions.some(
    (position) => itemPosition >= position.start && itemPosition <= position.end
  );
};
