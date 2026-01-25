import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem("adminLoggedIn");

  if (!isAdmin) {
    return <Navigate to="/admin" />;
  }

  return children;
}

export default ProtectedRoute;
