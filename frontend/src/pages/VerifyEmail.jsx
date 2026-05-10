import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function VerifyEmail() {
  const { token } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await API.get(`/auth/verify/${token}`);

        alert(res.data.message);

        navigate("/");

      } catch (error) {
        alert(
          error.response?.data?.message ||
          "Verification failed"
        );
      }
    };

    verifyUser();
  }, [token, navigate]);

  return (
    <div>
      <h2>Verifying Email...</h2>
    </div>
  );
}

export default VerifyEmail;