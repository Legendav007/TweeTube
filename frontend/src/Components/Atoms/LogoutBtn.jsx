import { useDispatch } from "react-redux";
import { logout } from "../../Store/authSlice";
import { useNavigate } from "react-router-dom";

function LogoutBtn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <button
      onClick={logoutHandler}
      className="w-full rounded dark:bg-[#383737] bg-[#ffefef] dark:text-white text-red-500  px-3 py-2 dark:hover:bg-[#4f4e4e] sm:w-auto sm:bg-transparen"
    >
      Logout
    </button>
  );
}

export default LogoutBtn;
