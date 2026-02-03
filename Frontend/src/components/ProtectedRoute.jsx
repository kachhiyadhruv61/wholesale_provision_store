import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem("adminLoggedIn");

  if (!isAdmin || isAdmin !== "true") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;

