import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); // reset errore ad ogni submit
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user._id);

        navigate("/commesse");
      } else {
        setErr("Token mancante nella risposta");
      }
    } catch (error) {
      setErr(error.response?.data?.message || "Errore login");
      setPassword(""); // pulisco password in caso di errore
      // non navigare a /register, rimani qui per permettere un altro tentativo
    }
  };

  return (
    <div className="centered-container">
      <form onSubmit={submit} className="auth-card">
        <h2>Login</h2>
        {err && <p style={{ color: "red" }}>{err}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Accedi</button>
        <p style={{ marginTop: "1rem" }}>
          <a href="/forgot-password">Hai dimenticato la password?</a>
        </p>
      </form>
    </div>
  );
}
