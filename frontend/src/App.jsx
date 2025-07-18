import './App.css'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import lightLoader from "./assets/lightLoader.gif";
import loader from "./assets/loader.gif"
import { getCurrentUser } from './Store/userSlice.js';
import { healthCheck } from './Store/healthcheck.js';

function App() {
  const dispatch = useDispatch();

  const [initialLoading, setInitialLoading] = useState(true);

  // added dark mode functionality
  const darkMode = useSelector((state) => state.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

 
  useEffect(() => {
    dispatch(healthCheck()).then(() => {
      dispatch(getCurrentUser()).then(() => {
        setInitialLoading(false);
      });
    });
    setInterval(() => {
      dispatch(healthCheck());
    }, 5 * 60 * 1000);
  }, []);

  if (initialLoading)
    return (
      <div className="h-screen w-full  overflow-y-auto dark:bg-black bg-white text-red-500 dark:text-white">
        <div className="flex flex-col items-center justify-center mt-64">
          <img src={lightLoader} className="logo w-24  " alt="Loading..." />
          <h1 className="text-3xl text-center mt-8 font-semibold">
            Tweetube is Waiting...
          </h1>
          {/* <h1 className="text-xl text-center mt-4">Refresh the page if it takes too long</h1> */}
        </div>
      </div>
    );


  return (
    <>
      <Outlet />
      <div id="popup-models" className="bg-purple-400 relative"></div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition:Bounce
      />
    </>
  );
}

export default App;
