import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/api/auth/register", formData);
      navigate("/login");
    } catch (err) {
      // Log completo dell'errore in console per debug
      console.log("Errore registrazione:", err.response?.data);

      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Errore durante la registrazione");
      }
    }
  };

  return (
    <div className="centered-container">
      <div className="auth-card">
        <h2>Registrati</h2>
        {error && <p>{error}</p>}
        <form onSubmit={handleSubmit} className="form-container">
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </label>
          <button type="submit">Registrati</button>
          <button type="button" onClick={() => navigate("/login")}>
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}
