import { useEffect, useRef } from "react";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let googleScriptPromise;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
      const script = existingScript || document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Google sign-in could not be loaded."));
      if (!existingScript) document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

export default function GoogleSignInButton({ onCredential, onError, disabled = false }) {
  const buttonRef = useRef(null);
  const credentialHandler = useRef(onCredential);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    credentialHandler.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let active = true;
    if (!clientId || !buttonRef.current) return undefined;

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) credentialHandler.current(credential);
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          // Google's medium button is not personalized with the account name/email.
          size: "medium",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(buttonRef.current.parentElement?.clientWidth || 360, 400),
        });
      })
      .catch(() => {});

    return () => {
      active = false;
      if (buttonRef.current) buttonRef.current.replaceChildren();
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onError?.("Google sign-in needs VITE_GOOGLE_CLIENT_ID configured in the frontend environment.")}
        className="w-full min-h-11 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-ink hover:bg-bg disabled:opacity-60"
      >
        <span className="mr-2 font-bold text-[#4285F4]">G</span>
        Continue with Google
      </button>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div ref={buttonRef} className="flex justify-center min-h-10" />
    </div>
  );
}
