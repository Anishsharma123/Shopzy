import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      // ✅ Login request (cookie will be set automatically)
      await API.post("/auth/login", {
        email,
        password,
        rememberMe,
      });

      // ✅ Get current user
      const res = await API.get("/auth/me");

      // ✅ Save user in global state
      setUser(res.data.user);

      alert("Login Successful ✅");

      navigate("/home");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed ❌");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        <p>
          Don't have an account? <Link to="/signup">Signup</Link>
        </p>
        <label style={{ fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember Me
        </label>
        <p>
          Forgot Password? <Link to="/forgot-password">Click here</Link>
        </p>
        <button
          onClick={() => {
            window.location.href = "http://localhost:5000/api/auth/google";
          }}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}

export default Login;
