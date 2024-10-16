import { useCallback, useState } from "react";
import YouTube from "react-youtube";

import video from "./video.png";

export const VideoLanding = () => {
  const [isVideoStarted, setVideoStarted] = useState<boolean>(false);
  const onClick = useCallback(() => setVideoStarted(true), []);
  return (
    <div>
      {isVideoStarted ? (
        <div>
          <YouTube
            videoId="Eg5yXLuMdZw"
            opts={{
              height: "355",
              width: "629",
              playerVars: {
                autoplay: 1,
                color: "pink",
                controls: 1,
                showinfo: 0,
              },
            }}
          />
        </div>
      ) : (
        <div onClick={onClick}>
          <img
            src={video}
            className="border border-slate-200 hover:border-slate-300 w-[362px] h-[224px] p-0 m-0 cursor-pointer"
            width="368"
            height="224"
          />
        </div>
      )}
    </div>
  );
};
