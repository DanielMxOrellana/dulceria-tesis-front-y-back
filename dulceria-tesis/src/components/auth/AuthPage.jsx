import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import './Auth.css';

export default function AuthPage() {
  const { login, register, resetPassword, updatePassword } = useApp();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Detect mode from URL
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'reset') {
      setMode('reset');
      // Supabase put the access_token in the hash
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = hashParams.get('access_token');
        if (accessToken) setToken(accessToken);
      }
    }
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccessMsg('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password);
        if (res && res.error) setError(res.error);
        return;
      }

      if (mode === 'register') {
        if (!form.name.trim()) return setError('El nombre es requerido.');
        const res = await register(form.name, form.email, form.password);
        if (res && res.error) setError(res.error);
        else if (res && res.needsVerification) {
          setSuccessMsg('¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta antes de iniciar sesión.');
          setForm({ name: '', email: '', password: '' });
          setTimeout(() => setMode('login'), 6000);
        }
        return;
      }

      if (mode === 'forgot') {
        const res = await resetPassword(form.email);
        if (res && res.error) setError(res.error);
        else setSuccessMsg('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
        return;
      }

      if (mode === 'reset') {
        if (!token) return setError('Token invalido o expirado. Por favor solicita uno nuevo.');
        const res = await updatePassword(form.password, token);
        if (res && res.error) setError(res.error);
        else {
          setSuccessMsg('Contraseña actualizada. Ya puedes iniciar sesión.');
          setTimeout(() => setMode('login'), 3000);
        }
        return;
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError('Ocurrió un problema con la autenticación.');
    }
  };

  const demo = (selectedRole) => {
    if (selectedRole === 'admin') login('admin@dulceria.com', '123456');
    else if (selectedRole === 'vendor') login('sweetdreams@vendor.com', '123456');
    else login('maria@email.com', '123456');
  };

  return (
    <div className="auth-page">
      <div
        className="auth-deco"
        style={{ '--auth-photo': `url(${process.env.PUBLIC_URL}/img/dulces/canasto.png)` }}
      />

      <main className="auth-panel">
        <section className="auth-card">
          <div className="auth-logo">
            <img src={process.env.PUBLIC_URL + '/img/dulces/logo.jpg'} alt="Dulcería El Suspiro" />
          </div>

          <h2>
            {mode === 'login' ? 'Bienvenido de vuelta' :
              mode === 'register' ? 'Crear cuenta' :
                mode === 'reset' ? 'Nueva contraseña' : 'Recuperar contraseña'}
          </h2>
          <p className="auth-sub">
            {mode === 'login' ? 'Inicia sesión para hacer tus pedidos' :
              mode === 'register' ? 'Regístrate para comenzar a pedir' :
                mode === 'reset' ? 'Ingresa tu nueva contraseña' :
                  'Ingresa tu correo y te enviaremos instrucciones'}
          </p>

          {['login', 'register'].includes(mode) && (
            <div className="auth-tabs" role="tablist" aria-label="Modo de acceso">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => changeMode('login')}
              >
                Ingreso
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => changeMode('register')}
              >
                Registro
              </button>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label>Nombre completo</label>
                <div className="input-icon">
                  <User size={16} />
                  <input name="name" type="text" placeholder="Tu nombre" value={form.name} onChange={handle} required />
                </div>
              </div>
            )}

            {mode !== 'reset' && (
              <div className="form-group">
                <label>Correo electrónico</label>
                <div className="input-icon">
                  <Mail size={16} />
                  <input name="email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={handle} required />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="form-group">
                <div className="password-label">
                  <label>{mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}</label>
                  {mode === 'login' && (
                    <button type="button" className="forgot-link" onClick={() => changeMode('forgot')}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="input-icon">
                  <Lock size={16} />
                  <input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handle} required />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)} aria-label="Mostrar contraseña">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg auth-submit">
              {mode === 'login' ? 'Iniciar sesión' :
                mode === 'register' ? 'Crear cuenta' :
                  mode === 'reset' ? 'Actualizar contraseña' : 'Enviar instrucciones'}
            </button>
          </form>

          {['forgot', 'reset'].includes(mode) && (
            <div className="auth-switch">
              ¿Ya tienes cuenta? <button onClick={() => changeMode('login')}>Inicia sesión</button>
            </div>
          )}

          {mode === 'login' && (
            <>
              <div className="auth-divider"><span>o</span></div>
              <div className="demo-btns">
                <p className="demo-label">Acceso de demostración:</p>
                <div className="demo-row">
                  <button className="btn btn-secondary" type="button" onClick={() => demo('admin')}>Admin</button>
                  <button className="btn btn-secondary" type="button" onClick={() => demo('client')}>Cliente</button>
                  <button className="btn btn-secondary" type="button" onClick={() => demo('vendor')}>Vendedor</button>
                </div>
                <p className="demo-note">Contraseña: 123456</p>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
