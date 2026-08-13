import React, { useState } from "react";
import { Input, Button, Spinner } from "../shared";
import { login } from "../../service/auth";
import { ApiError } from "../../types";
import { setUserCookie, setRefreshToken } from "../../utils/user";
import { useNavigate } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.trim() });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    const subdomain = window.location.hostname.split(".")[0];

    try {
      setIsLoading(true);
      const response = await login(
        formData.email.toLowerCase(),
        formData.password,
        subdomain
      );

      if (response.status === 200 || response.status === 201) {
        setUserCookie(response.data.access_token);
        if (response.data.refresh_token) {
          setRefreshToken(response.data.refresh_token);
        }
        navigate("/");
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.response?.status === 403 && apiError.response.data?.redirect_url) {
        if (apiError.response.data.access_token) {
          setUserCookie(apiError.response.data.access_token);
        }
        if (apiError.response.data.refresh_token) {
          setRefreshToken(apiError.response.data.refresh_token);
        }
        window.location.href = apiError.response.data.redirect_url;
        return;
      }
      setError(apiError.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Input
        label="Desk Email"
        icon="mail"
        type="email"
        name="email"
        placeholder="Enter your desk email"
        value={formData.email}
        onChange={handleChange}
      />

      <Input
        label="Password"
        icon="lock"
        type="password"
        name="password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 font-semibold text-xs text-center">
            {error}
          </p>
        </div>
      )}

      <Button
        disabled={isLoading}
        type="submit"
        className="bg-primary-base hover:bg-primary-base/90 py-4 text-white font-bold rounded-xl shadow-md shadow-primary-base/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 text-base cursor-pointer"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Log in to Front Desk</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {/* Security Assurance */}
      <div className="flex items-center justify-center gap-1.5 text-grey-2 text-[11px] pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-primary-base" />
        <span>Protected Front Desk Session</span>
      </div>
    </form>
  );
};
