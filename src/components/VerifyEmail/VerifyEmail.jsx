import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmEmail, resendOtp } from "../../services/authService";

const validationSchema = Yup.object({
  otp: Yup.string().length(6, "Enter the 6-digit code").required("Enter the code"),
});

export default function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email] = useState(state?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [resending, setResending] = useState(false);

  const formik = useFormik({
    initialValues: { otp: "" },
    validationSchema,
    onSubmit: async (values) => {
      setApiError("");
      setIsLoading(true);
      try {
        await confirmEmail({ email, otp: values.otp });
        toast.success("Email confirmed — you can log in now.");
        navigate("/login");
      } catch (error) {
        setApiError(error?.response?.data?.message || "That code didn't work. Check it and try again.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  async function handleResend() {
    setResending(true);
    try {
      await resendOtp({ email });
      toast.success("New code sent to your email.");
    } catch {
      toast.error("Couldn't resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-2">Confirm your email</h1>
      <p className="text-sm text-ink-soft mb-6">
        We sent a 6-digit code to {email ? <strong>{email}</strong> : "your email"}.
      </p>

      {apiError && (
        <div className="bg-like/10 text-like text-sm rounded-lg px-3.5 py-2.5 mb-4">{apiError}</div>
      )}
      {!email && (
        <div className="bg-gold/10 text-gold text-sm rounded-lg px-3.5 py-2.5 mb-4">
          We couldn't tell which email this is for — open this page again from the signup or login flow, or enter it below.
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="otp">Verification code</label>
          <input
            id="otp"
            name="otp"
            maxLength={6}
            onChange={formik.handleChange}
            value={formik.values.otp}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm tracking-[0.3em] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {formik.touched.otp && formik.errors.otp && (
            <p className="text-like text-xs mt-1">{formik.errors.otp}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
        >
          {isLoading ? "Confirming…" : "Confirm email"}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending || !email}
        className="w-full text-center text-sm text-primary font-medium mt-5 disabled:opacity-50"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>

      <p className="text-center text-sm text-ink-soft mt-4">
        <Link to="/login" className="text-primary font-semibold">Back to log in</Link>
      </p>
    </>
  );
}
