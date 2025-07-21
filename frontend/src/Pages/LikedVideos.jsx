import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getLikedVideos } from "../Store/likeSlice.js";
import { formatTimestamp, formatVideoDuration } from "../Helpers/formatFigures.js";
import { GuestComponent, VideoList } from "../Components/index.js";
import { icons } from "../assets/icons.jsx";

function LikedVideos() {
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getLikedVideos()).then((res) => {
      setVideos(res.payload);
      setIsLoading(false);
    });
  }, []);

  const isHistoryEmpty = !isLoading && videos?.length < 1;

  return <>
  {!isHistoryEmpty && <VideoList videos={videos} loading={isLoading} />}
  {isHistoryEmpty && (
    <GuestComponent
      title="Empty Liked Video"
      subtitle="You have no previously Liked Videos."
      icon={<span className="p-5">{icons.Like}</span>}
      guest={false}
    />
  )}
  </>
}

export default LikedVideos;