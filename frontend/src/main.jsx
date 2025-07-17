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
  Feed , GuestTweets
} from "./Components/index.js"

import FeedVideos from './Pages/FeedVideos.jsx'
import FeedTweets from './Pages/FeedTweets.jsx'

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
