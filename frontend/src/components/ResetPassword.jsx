import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setMsg(res.data.message);
      setErr('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setErr(error.response?.data?.message || 'Errore');
      setMsg('');
    }
  };

  return (
    <div className='centered-container'>
      <form onSubmit={submit} className='auth-card'>
        <h2>Imposta nuova password</h2>
        {msg && <p style={{ color: 'green' }}>{msg}</p>}
        {err && <p style={{ color: 'red' }}>{err}</p>}
        <input
          type="password" placeholder="Nuova password"
          value={password} onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Aggiorna password</button>
      </form>
    </div>
  );
}
