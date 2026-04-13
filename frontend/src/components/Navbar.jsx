import { Link } from "react-router-dom";
import "../styles/navbar.css";

import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { cart } = useContext(CartContext);
  console.log(cart);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <h2>E-Shop</h2>

      <div>
        <Link to="/">Login</Link>
        <Link to="/home">Home</Link>
        <Link to="/cart">Cart ({cart.length})</Link>
        <Link to="/signup">Signup</Link>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
