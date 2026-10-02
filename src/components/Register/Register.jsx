import { useContext, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { loginWithGoogle, signup, signupWithGoogle } from "../../services/authService";
import { GENDERS } from "../../utils/constants";
import { UserContext } from "../../context/UserContext";
import GoogleSignInButton from "../GoogleSignInButton/GoogleSignInButton";

const phoneRegex = /^01[0125][0-9]{8}$/;

const validationSchema = Yup.object({
  username: Yup.string().min(3, "At least 3 characters").required("Name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  phone: Yup.string().matches(phoneRegex, "Enter a valid Egyptian phone number").required("Phone is required"),
  gender: Yup.number().required("Select a gender"),
  password: Yup.string()
    .min(8, "At least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();
  const { loginSuccess } = useContext(UserContext);

  async function handleRegister(values) {
    setApiError("");
    setIsLoading(true);
    try {
      await signup(values);
      // backend sends a confirm-email OTP after signup
      navigate("/verify-email", { state: { email: values.email } });
    } catch (error) {
      setApiError(error?.response?.data?.message || "Couldn't create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleRegister(idToken) {
    setApiError("");
    setIsLoading(true);
    try {
      await signupWithGoogle(idToken);
      // The signup endpoint provisions/recognizes the account; login returns the session tokens.
      const { data } = await loginWithGoogle(idToken);
      const token = data?.data?.access_token;
      const refreshToken = data?.data?.refresh_token;
      if (!token) throw new Error("No token returned from the server");
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      loginSuccess(token);
      navigate("/");
    } catch (error) {
      setApiError(error?.response?.data?.message || "Couldn't create your account with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      phone: "",
      gender: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: handleRegister,
  });

  const field = (name, label, type = "text") => (
    <div>
      <label className="block text-sm font-medium mb-1.5" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
        className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-like text-xs mt-1">{formik.errors[name]}</p>
      )}
    </div>
  );

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-6 text-center">Create your account</h1>

      {apiError && (
        <div className="bg-like/10 text-like text-sm rounded-lg px-3.5 py-2.5 mb-4">{apiError}</div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {field("username", "Full name")}
        {field("email", "Email", "email")}
        {field("phone", "Phone number")}

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.gender}
            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="" disabled>Select…</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          {formik.touched.gender && formik.errors.gender && (
            <p className="text-like text-xs mt-1">{formik.errors.gender}</p>
          )}
        </div>

        {field("password", "Password", "password")}
        {field("confirmPassword", "Confirm password", "password")}

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-3/4 bg-primary text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
          >
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>

      <div className="mt-5">
        <div className="flex items-center gap-3 mb-4 text-xs text-ink-soft">
          <span className="h-px flex-1 bg-border" />
          <span>or sign up with</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleSignInButton
          onCredential={handleGoogleRegister}
          onError={setApiError}
          disabled={isLoading}
        />
      </div>

      <p className="text-center text-sm text-ink-soft mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-semibold">Log in</Link>
      </p>
    </>
  );
}
