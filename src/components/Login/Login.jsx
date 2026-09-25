import { useContext, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { login } from "../../services/authService";
import { getFcmToken } from "../../services/pushNotifications";
import { UserContext } from "../../context/UserContext";

const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const { loginSuccess } = useContext(UserContext);
  const navigate = useNavigate();

  async function handleLogin(values) {
    setApiError("");
    setIsLoading(true);
    try {
      const fcm = await getFcmToken(); // best-effort, null if unsupported/denied
      const { data } = await login(fcm ? { ...values, fcm } : values);
      const token = data?.data?.access_token;
      const refreshToken = data?.data?.refresh_token;
      if (!token) throw new Error("No token returned from the server");
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      loginSuccess(token);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      setApiError(error?.response?.data?.message || "Couldn't log you in. Check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: handleLogin,
  });

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-6">Log in</h1>

      {apiError && (
        <div className="bg-like/10 text-like text-sm rounded-lg px-3.5 py-2.5 mb-4">{apiError}</div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-like text-xs mt-1">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary font-medium">Forgot it?</Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-like text-xs mt-1">{formik.errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white font-semibold text-sm rounded-lg py-2.5 mt-2 disabled:opacity-60"
        >
          {isLoading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft mt-6">
        New here?{" "}
        <Link to="/signup" className="text-primary font-semibold">Create an account</Link>
      </p>
    </>
  );
}
