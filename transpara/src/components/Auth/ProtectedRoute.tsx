import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { ReactElement } from "react";

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) return null;

  if (!user) return <Navigate to="/" />;
  if (!user.emailVerified) return <Navigate to="/verify-email" />;

  return children;
};
