import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const SuperLayout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};

export default SuperLayout;
