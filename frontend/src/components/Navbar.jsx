import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import API from "../services/api";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { cart } = useContext(CartContext);
  const { user, setUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout"); // call backend
      setUser(null); // clear frontend state
      navigate("/"); // redirect to login
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <nav className="navbar">
      <h2>E-Shop</h2>

      <div>
        {!user ? (
          <>
            <Link to="/">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        ) : (
          <>
            <Link to="/home">Home</Link>
            <Link to="/cart">Cart ({cart.length})</Link>

            <span style={{ marginLeft: "10px" }}>
              {user?.email}
            </span>

            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;