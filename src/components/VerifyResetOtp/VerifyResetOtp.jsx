import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtpPassword } from "../../services/authService";

const validationSchema = Yup.object({
  otp: Yup.string().length(6, "Enter the 6-digit code").required("Enter the code"),
});

export default function VerifyResetOtp() {
  const { state } = useLocation();
  const email = state?.email || "";
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const formik = useFormik({
    initialValues: { otp: "" },
    validationSchema,
    onSubmit: async (values) => {
      setApiError("");
      setIsLoading(true);
      try {
        await verifyOtpPassword({ email, otp: values.otp });
        navigate("/reset-password", { state: { email } });
      } catch (error) {
        setApiError(error?.response?.data?.message || "That code didn't work.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-2">Enter the code</h1>
      <p className="text-sm text-ink-soft mb-6">
        Sent to {email ? <strong>{email}</strong> : "your email"}.
      </p>

      {apiError && (
        <div className="bg-like/10 text-like text-sm rounded-lg px-3.5 py-2.5 mb-4">{apiError}</div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <input
          name="otp"
          maxLength={6}
          onChange={formik.handleChange}
          value={formik.values.otp}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm tracking-[0.3em] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {formik.touched.otp && formik.errors.otp && (
          <p className="text-like text-xs mt-1">{formik.errors.otp}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
        >
          {isLoading ? "Verifying…" : "Verify code"}
        </button>
      </form>
    </>
  );
}
