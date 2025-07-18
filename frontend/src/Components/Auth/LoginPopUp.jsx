import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { login } from "../../Store/authSlice.js";
import { Logo, Input, Button } from "../index.js";
import { Link, useNavigate } from "react-router-dom";
import { useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { icons } from "../../assets/icons.jsx";

function LoginPopup({ route, message = "Login to Continue..." }, ref) {
  const dialog = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(false);

  const { loading } = useSelector(({ auth }) => auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useImperativeHandle(ref, () => {
    return {
      open() {
        setShowPopup(true);
      },
      close() {
        handleClose();
      },
    };
  });

  useEffect(() => {
    if(showPopup && dialog.current){
      dialog.current.showModal();
    }
  }, [showPopup]);

  const handleLogin = (data) => {
    const isEmail = !data.username.startsWith("@");

    if (isEmail) {
      let isValidEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.username);
      if (!isValidEmail) {
        toast.error("Please enter valid email id");
        return;
      }
    }

    const loginData = isEmail
      ? { email: data.username, password: data.password }
      : { username: data.username.substr(1), password: data.password };

    dispatch(login(loginData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled"){
        if (route) navigate(route);
        setShowPopup(false);
      }
    });
  };

  const handleClose = () => {
    dialog.current.close();
    setShowPopup(false);
    if (route) navigate(route);
  };

  return (
    <div className="absolute  ">
      {showPopup &&
        createPortal(
          <dialog
            ref={dialog}
            onClose={handleClose}
            className=" mx-auto w-[90%] backdrop:backdrop-blur-sm sm:w-[60%] lg:w-[40%] xl:w-[30%] overflow-y-auto border border-red-300 bg-white dark:bg-gray-900/80 dark:text-white text-black rounded  "
          >
            <div className="mx-8 my-6 mb-8 flex flex-col relative  ">
              <button
                autoFocus
                type="button"
                onClick={handleClose}
                className=" absolute right-0 top-1 h-7 w-7 focus:border focus:border-dotted hover:border-dotted hover:border"
              >
                {icons.cross}
              </button>
              <Logo width="w-12" className="absolute  top-0 left-[45%] sm:w-12 " />
              <h6 className="mx-auto mt-14 mb-2 text-2xl font-semibold">{message}</h6>
              <h6 className="mx-auto text-md mb-3">
                Don't have an Account yet?{" "}
                <Link to={"/signup"} className="font-semibold text-blue-600 hover:text-blue-400">
                  Sign up now
                </Link>
              </h6>
              <form
                onSubmit={handleSubmit(handleLogin)}
                className="mx-auto flex w-full flex-col px-4 gap-y-2"
              >
                <Input
                  label="Username or Email address"
                  required
                  placeholder="use @ for username"
                  {...register("username", {
                    required: true,
                  })}
                />
                {errors.username?.type === "required" && (
                  <span className="text-red-500 mt-1">*username or email is required</span>
                )}
                <Input
                  label="Password"
                  labelClassName="mt-4"
                  type="password"
                  required
                  placeholder="Enter the Password"
                  {...register("password", { required: true })}
                />
                {errors.password?.type === "required" && (
                  <span className="text-red-500 mt-1">*password is required</span>
                )}
                <div className="flex flex-1 gap-x-4 mt-5">
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="grow dark:bg-black/10 dark:hover:bg-black/20 hover:border-dotted border dark:border-white dark:text-white bg-zinc-400 hover:bg-zinc-500 rounded-full text-black "
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="grow hover:border-dotted border border-white text-white bg-red-500  rounded-full hover:bg-red-600 dark:hover:bg-[#ae7aff] dark:bg-[#883eff] "
                  >
                    {loading ? <span>{icons.loading}</span> : "Sign in"}
                  </Button>
                </div>
              </form>
            </div>
          </dialog>,
          document.getElementById("popup-models")
        )}
    </div>
  );
}

export default React.forwardRef(LoginPopup);
