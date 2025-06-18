import React, { useState } from 'react';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMsg(res.data.message);
      setErr('');
    } catch (error) {
      setErr(error.response?.data?.message || 'Errore');
      setMsg('');
    }
  };

  return (
    <div className='centered-container'>
      <form onSubmit={submit} className='auth-card'>
        <h2>Recupera Password</h2>
        {msg && <p style={{ color: 'green' }}>{msg}</p>}
        {err && <p style={{ color: 'red' }}>{err}</p>}
        <input
          type="email" placeholder="Inserisci la tua email"
          value={email} onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Invia link reset</button>
      </form>
    </div>
  );
}
