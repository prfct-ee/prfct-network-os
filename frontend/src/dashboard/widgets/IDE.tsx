import { runes } from "prfct-network-engine/utils/runes";
import {
  deleteInIDFS,
  findPathToElementInIDFS,
  lostInIDFS,
  pushToIdfsTree,
  Router,
  StateElementTypes,
  VerificationStatus,
  verifyElementInIDFS,
  verifyRouterInIDFS,
} from "prfct-network-engine/idfs/IDFS";
import { useCallback, useEffect, useRef, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { state } from "../../network/consensus/consensus";

const getRandomString = () =>
  Array(10)
    .fill(0)
    .map(() => runes[Math.floor(runes.length * Math.random())])
    .join("");

export const IDE = () => {
  const publishInputEl = useRef<HTMLInputElement>(null);
  const deleteInputEl = useRef<HTMLInputElement>(null);
  const lostInputEl = useRef<HTMLInputElement>(null);
  const verifyInputEl = useRef<HTMLInputElement>(null);
  const pathInputEl = useRef<HTMLInputElement>(null);
  const routerVerificationInputEl = useRef<HTMLInputElement>(null);
  const layerToRouterInputEl = useRef<HTMLInputElement>(null);
  const shiftToRouterInputEl = useRef<HTMLInputElement>(null);

  const [verification, setVerification] = useState<VerificationStatus>();
  const [routerVerification, setRouterVerification] = useState<VerificationStatus>();
  const [showVerification, setShowVerification] = useState<boolean>();
  const [showRouterVerification, setShowRouterVerification] = useState<boolean>();
  const [foundPath, setFoundPath] = useState<Router[]>();

  useEffect(() => {
    publishInputEl.current && (publishInputEl.current.value = getRandomString());
  }, []);

  const onClickPublish = useCallback(() => {
    const code = publishInputEl.current?.value;
    publishInputEl.current && (publishInputEl.current.value = getRandomString());
    pushToIdfsTree({
      lookupKey: "no lookup key",
      data: code || "",
      type: StateElementTypes.WALLET,
      owner: "testhexid",
      ttd: 0,
      createdAt: state.blockNumber,
    });
  }, [publishInputEl]);

  const onClickDelete = useCallback(() => {
    const hexid = deleteInputEl.current?.value;
    if (hexid) deleteInIDFS(hexid);
    if (deleteInputEl.current) deleteInputEl.current.value = "";
  }, [deleteInputEl]);

  const onClickLost = useCallback(() => {
    const hexid = lostInputEl.current?.value;
    if (hexid) lostInIDFS(hexid);
    if (lostInputEl.current) lostInputEl.current.value = "";
  }, [lostInputEl]);

  const onClickVerify = useCallback(async () => {
    const hexid = verifyInputEl.current?.value;
    if (verifyInputEl.current) verifyInputEl.current.value = "";
    if (hexid) {
      setVerification(await verifyElementInIDFS(hexid));
      setShowVerification(true);
    }
  }, [verifyInputEl]);

  const onClickVerifyRouter = useCallback(async () => {
    const hexid = pathInputEl.current?.value;
    const path = hexid && (await findPathToElementInIDFS(hexid));
    if (pathInputEl.current) pathInputEl.current.value = "";
    setFoundPath(path || []);
  }, [pathInputEl]);

  const onClickShowPathToRouter = useCallback(async () => {
    const hexid = routerVerificationInputEl.current?.value;
    const layer = layerToRouterInputEl.current?.value;
    const shift = shiftToRouterInputEl.current?.value;

    if (!hexid || !layer || !shift) {
      return;
    }

    const routerVerification = await verifyRouterInIDFS(hexid, Number(layer), Number(shift));

    if (routerVerificationInputEl.current) routerVerificationInputEl.current.value = "";
    if (layerToRouterInputEl.current) layerToRouterInputEl.current.value = "";
    if (shiftToRouterInputEl.current) shiftToRouterInputEl.current.value = "";

    setRouterVerification(routerVerification);
    setShowRouterVerification(true);
  }, [routerVerificationInputEl, layerToRouterInputEl, shiftToRouterInputEl]);

  const onChangeVerify = useCallback(() => setShowVerification(false), [verifyInputEl]);
  const onChangeRouterVerify = useCallback(() => setShowRouterVerification(false), [verifyInputEl]);

  return (
    <Widget>
      IDE
      <div className="block">
        <input ref={publishInputEl} className="border border-black"></input>
        <button className=" p-2" type="button" onClick={onClickPublish}>
          publish
        </button>
      </div>
      <div className="block">
        <input ref={deleteInputEl} className="border border-black"></input>
        <button className=" p-2" type="button" onClick={onClickDelete}>
          delete
        </button>
      </div>
      <div className="block">
        <input ref={lostInputEl} className="border border-black"></input>
        <button className=" p-2" type="button" onClick={onClickLost}>
          lost
        </button>
      </div>
      {/* SHOW PATH TO ELEMENT */}
      <div className="block">
        <input ref={pathInputEl} className="border border-black"></input>
        <button className=" p-2" type="button" onClick={onClickVerifyRouter}>
          show path to element
        </button>
      </div>
      <div className="block">
        {foundPath
          ? foundPath?.map((router) => `${router?.layer}/${router?.shift}`).join(" -> ") ||
            "path not found"
          : ""}
      </div>
      {/* VERIFY ELEMENT */}
      <div className="block">
        <input
          ref={verifyInputEl}
          onChange={onChangeVerify}
          className="border border-black"
        ></input>
        <button className=" p-2" type="button" onClick={onClickVerify}>
          verify element
        </button>
      </div>
      <div className="block">
        <span className={!showVerification ? "hidden" : ""}>
          {verification === VerificationStatus.FOUND ? (
            <span className="text-green-600">verified</span>
          ) : verification === VerificationStatus.NOT_FOUND ? (
            <span className="text-red-600">not found</span>
          ) : verification === VerificationStatus.LOST ? (
            <span>lost</span>
          ) : (
            ""
          )}
        </span>
      </div>
      {/* VERIFY ROUTER */}
      <div className="block">
        <input
          ref={routerVerificationInputEl}
          className="border border-black"
          placeholder="hexid"
          onChange={onChangeRouterVerify}
        ></input>
        <button className=" p-2" type="button" onClick={onClickShowPathToRouter}>
          verify router
        </button>
      </div>
      <div className="block w-1/2 pr-3">
        <input
          ref={layerToRouterInputEl}
          className="border border-black w-1/2"
          placeholder="layer"
        ></input>
        <input
          ref={shiftToRouterInputEl}
          className="border border-black w-1/2"
          placeholder="shift"
        ></input>
      </div>
      <div className="block">
        <span className={!showRouterVerification ? "hidden" : ""}>
          {routerVerification === VerificationStatus.FOUND ? (
            <span className="text-green-600">verified</span>
          ) : routerVerification === VerificationStatus.NOT_FOUND ? (
            <span className="text-red-600">not found</span>
          ) : routerVerification === VerificationStatus.LOST ? (
            <span>lost</span>
          ) : (
            ""
          )}
        </span>
      </div>
    </Widget>
  );
};
