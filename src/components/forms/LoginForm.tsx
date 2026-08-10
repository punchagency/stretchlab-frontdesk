import React, { useState } from "react";
import { Input, Button, Spinner } from "../shared";
import { login } from "../../service/auth";
import { ApiError } from "../../types";
import { setUserCookie, setRefreshToken } from "../../utils/user";
import { useNavigate } from "react-router";

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
      setError(apiError.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Input
        label="Email"
        icon="mail"
        type="email"
        name="email"
        placeholder="Enter your email"
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
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 font-medium text-sm text-center">
            {error}
          </p>
        </div>
      )}

      <Button
        disabled={isLoading}
        type="submit"
        className="bg-primary-base py-4 text-white flex items-center justify-center gap-2 mt-4"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>Logging in...</span>
          </>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
};
