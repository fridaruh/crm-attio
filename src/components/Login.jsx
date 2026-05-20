import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Login({ allowedEmail }) {
  const [error, setError] = useState(null);

  async function handleLogin() {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== allowedEmail) {
        await auth.signOut();
        setError(`La cuenta ${result.user.email} no tiene acceso. Usa ${allowedEmail}.`);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Ocurrió un error al iniciar sesión. Intenta de nuevo.');
      }
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', background: '#0a0a0a', gap: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 18,
        }}>A</div>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>Frida Ruh</span>
      </div>

      <button onClick={handleLogin} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 24px', borderRadius: 8, border: '1px solid #333',
        background: '#1a1a1a', color: '#fff', fontSize: 15,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41.1 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
        Continuar con Google
      </button>

      {error && (
        <p style={{
          color: '#f87171', fontSize: 13, textAlign: 'center',
          maxWidth: 320, lineHeight: 1.5,
        }}>{error}</p>
      )}
    </div>
  );
}
