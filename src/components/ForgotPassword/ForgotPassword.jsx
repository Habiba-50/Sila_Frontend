import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordOtp } from "../../services/authService";

const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema,
    onSubmit: async (values) => {
      setApiError("");
      setIsLoading(true);
      try {
        await forgotPasswordOtp(values);
        navigate("/verify-reset-otp", { state: { email: values.email } });
      } catch (error) {
        setApiError(error?.response?.data?.message || "Couldn't find that account.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-2">Reset your password</h1>
      <p className="text-sm text-ink-soft mb-6">We'll send a code to your email to verify it's you.</p>

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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
        >
          {isLoading ? "Sending code…" : "Send code"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft mt-6">
        <Link to="/login" className="text-primary font-semibold">Back to log in</Link>
      </p>
    </>
  );
}
