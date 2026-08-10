import React, { useState, useEffect } from "react";
import { Button, Input, Spinner } from "../shared";
import { useNavigate } from "react-router";
import { addDetails } from "../../service/auth";
import { ApiError } from "../../types";
import { jwtDecode } from "jwt-decode";
import { renderErrorToast, renderSuccessToast } from "../../utils/toast";
import logo from "../../assets/images/stretchnote.png";

export const AcceptInviteForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("email");
    if (token) {
      try {
        const decoded: { email?: string } = jwtDecode(token);
        if (decoded.email) {
          setFormData((prev) => ({
            ...prev,
            email: decoded.email ?? "",
          }));
        }
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "email" ? value.trim() : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.full_name) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsLoading(true);
      const response = await addDetails(formData.email, formData.password, formData.full_name);

      if (response.status === 200) {
        renderSuccessToast(response.data.message);
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      const apiError = error as ApiError;
      renderErrorToast(apiError.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 md:p-12 w-full max-w-2xl border border-grey-1 text-center">
        <div className="flex justify-center mb-2">
          <img src={logo} alt="StretchLab" className="w-48 h-auto" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-dark-1">Accept Invite</h2>
        <p className="text-grey-5 mb-8">
          Enter your details to accept the invite
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Email"
            icon="mail"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            disabled={true}
          />
          <Input
            label="Name"
            icon="user"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
          <Input
            label="Password"
            icon="lock"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
          <Input
            label="Confirm Password"
            icon="lock"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 font-medium text-sm text-center">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-base py-4 text-white flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span>Submitting...</span>
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
