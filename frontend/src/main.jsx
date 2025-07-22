import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'
import ReactDom from "react-dom/client"
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./Store/store.js";
import {
  Login , SignUp , AuthLayout , LoginPopUp , PageNotFound , Home,
  Feed , GuestTweets , GuestAdmin , ChannelVideos , GuestMyChannel,
  ChannelTweets , ChannelPlaylist , ChannelSubscribed , AboutChannel,
  GuestHistory , GuestLikedVideos , GuestSubscribers
} from "./Components/index.js"

import Channel from './Pages/Channel.jsx'
import FeedVideos from './Pages/FeedVideos.jsx'
import FeedTweets from './Pages/FeedTweets.jsx'
import Dashboard from "./Pages/Dashboard.jsx"
import VideoDetail from "./Pages/VideoDetail.jsx"
import History from './Pages/History.jsx'
import LikedVideos from './Pages/LikedVideos.jsx'
import SearchResult from './Pages/SearchResult.jsx'
import Support from './Pages/Support.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Main Layout Route */}
      <Route path="/" element={<App />}>
        <Route path="" element={<Home />}>
          <Route path="" element={<Feed />}>
            <Route index element={<FeedVideos />} />
            {/*Home page Feed tweets*/}
            <Route
              path="tweets"
                element={
                  <AuthLayout authentication guestComponent={<GuestTweets />}>
                    <FeedTweets />
                  </AuthLayout>
                }
            />
            {/* All Other Channels */}
            <Route path="user/:username" element={<Channel />}>
              <Route path="" element={<ChannelVideos owner={false} />} />
              <Route path="tweets" element={<ChannelTweets owner={false} />} />
              <Route path="playlists" element={<ChannelPlaylist owner={false} />} />
              <Route path="subscribed" element={<ChannelSubscribed owner={false} />} />
              <Route path="about" element={<AboutChannel owner={false} />} />
            </Route>

            {/*Owning my channel*/}
            <Route path="channel/:username" element={
              <AuthLayout authentication guestComponent={<GuestMyChannel/>}>
                <Channel owner/>
              </AuthLayout>
            }>
              <Route path="" element={<ChannelVideos owner/>} />
              <Route path="tweets" element={<ChannelTweets owner />} />
              <Route path="playlists" element={<ChannelPlaylist owner />} />
              <Route path="subscribed" element={<ChannelSubscribed owner />} />
              <Route path="about" element={<AboutChannel owner />} />
            </Route>

            {/*Admin Layout Route*/}
            <Route
              path = "/admin/dashboard"
              element = {
                <AuthLayout authentication guestComponent={<GuestAdmin/>}>
                  <Dashboard/>
                </AuthLayout>
              }
            />
            <Route path="/watch/:videoId" element={<VideoDetail />} />
            {/* user feed */}
            <Route
              path="feed/history"
              element={
                <AuthLayout authentication guestComponent={<GuestHistory/>}>
                  <History/>
                </AuthLayout>
              }
            />
            {/*Liked Videos*/}
            <Route path='feed/liked'
              element={
                <AuthLayout authentication guestComponent={<GuestLikedVideos/>}>
                  <LikedVideos/>
                </AuthLayout>
              }
            />
            {/* Subscribers */}
            <Route path='feed/subscribers'
              element={
                <AuthLayout authentication guestComponent={<GuestSubscribers/>}>
                  <ChannelSubscribed owner isSubscribers/>
                </AuthLayout>
              }
            />
            {/* Search Results */}
            <Route path='results' element={<SearchResult/>}/>
            {/* Support */}
            <Route path='support' element={<Support/>}/>
            
          </Route>
        </Route>
      </Route>

      {/* Login Route */}
      <Route
        path="/login"
        element={
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        }
      />

      {/* Signup Route */}
      <Route
        path="/signup"
        element={
          <AuthLayout authentication={false}>
            <SignUp />
          </AuthLayout>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<PageNotFound />} />
    </>
  )
);

createRoot(document.getElementById('root')).render(
  <Provider store = {store}>
    <RouterProvider router={router} />
  </Provider>
);
