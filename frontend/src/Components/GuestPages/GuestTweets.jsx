import React from "react";
import GuestComponent from "./GuestComponent.jsx";
import { icons } from "../../assets/icons.jsx";

function GuestTweets() {
  return (
    <GuestComponent
      title="Explore What's Happening Now by Tweets"
      subtitle="See the latest conversations and trending topics. Share your voice!"
      icon={<span className="p-4 w-full">{icons.Tweets}</span>}
    />
  );
}
export default GuestTweets;