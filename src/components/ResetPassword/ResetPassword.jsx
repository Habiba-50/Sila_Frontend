import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../../services/authService";

const validationSchema = Yup.object({
  password: Yup.string().min(8, "At least 8 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

export default function ResetPassword() {
  const { state } = useLocation();
  const email = state?.email || "";
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema,
    onSubmit: async (values) => {
      setApiError("");
      setIsLoading(true);
      try {
        await resetPassword({ email, ...values });
        toast.success("Password updated — log in with your new password.");
        navigate("/login");
      } catch (error) {
        setApiError(error?.response?.data?.message || "Couldn't reset your password.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-6">Choose a new password</h1>

      {apiError && (
        <div className="bg-like/10 text-like text-sm rounded-lg px-3.5 py-2.5 mb-4">{apiError}</div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">New password</label>
          <input
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
        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm password</label>
          <input
            name="confirmPassword"
            type="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.confirmPassword}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="text-like text-xs mt-1">{formik.errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
        >
          {isLoading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </>
  );
}
