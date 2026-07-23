import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Email validation function
  function isValidEmail(email) {
    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Check if email is from a disposable/temporary email service
  function isDisposableEmail(email) {
    const domain = email.split('@')[1].toLowerCase();
    const disposableDomains = [
      'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
      '10minutemail.com', 'throwaway.email', 'fakeinbox.com', 'trashmail.com',
      'yopmail.com', 'getnada.com', 'mailnator.com', 'emailondeck.com',
      'mailcatch.com', 'spambox.us', 'tempinbox.com', 'tempail.com',
      'maildrop.cc', 'mailmetrash.com', 'sharklasers.com', 'guerrillamail.org',
      'guerrillamail.net', 'guerrillamail.biz', 'mailgw.com', 'mailguard.me',
      'mailinator.net', 'mailinator.org', 'mailinator.co', 'mailinator.xyz'
    ];
    return disposableDomains.includes(domain);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validate full name
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    // Validate username
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address (e.g., name@domain.com)");
      return;
    }

    if (isDisposableEmail(email)) {
      setError("Please use a permanent email address. Temporary/disposable emails are not allowed.");
      return;
    }

    // Validate password
    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signUp({ email, password, fullName, username });
      setSuccess(true);
    } catch (err) {
      console.error("Signup error:", err);
      
      // Handle specific Supabase errors
      const errorMessage = err.message.toLowerCase();
      if (errorMessage.includes("user already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else if (errorMessage.includes("invalid email")) {
        setError("Invalid email format. Please check your email address.");
      } else if (errorMessage.includes("weak password")) {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError(err.message || "Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            We sent a confirmation link to <strong className="text-indigo-600 dark:text-indigo-400">{email}</strong>. 
            Please confirm your email address, then sign in.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>
          <Link
            to="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <MessageSquare className="text-white" size={18} />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
            Link<span className="text-indigo-500">Up</span>
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Join and start connecting with people.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="johndoe (letters, numbers, underscores only)"
              />
              <p className="mt-1 text-xs text-gray-400">3+ characters, letters, numbers, and underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
              <p className="mt-1 text-xs text-gray-400">Temporary/disposable emails are not allowed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="At least 6 characters"
              />
              <p className="mt-1 text-xs text-gray-400">Must contain uppercase, lowercase, and a number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}