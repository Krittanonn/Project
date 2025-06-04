import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ตรวจสอบเบื้องต้น - รหัสผ่านอย่างน้อย 6 ตัว (ถ้าต้องการ)
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3001/api/login', { username, password });
      localStorage.setItem('token', res.data.token);
      alert('Login สำเร็จ');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: '50px auto',
      padding: 20,
      border: '1px solid #ccc',
      borderRadius: 8,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
            style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #aaa' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #aaa' }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 10,
            fontSize: 16,
            borderRadius: 4,
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={e => e.target.style.backgroundColor = '#007bff'}
        >
          Login
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</p>}

      <p style={{ marginTop: 20, textAlign: 'center' }}>
        ยังไม่มีบัญชี?{' '}
        <Link to="/register" style={{ color: '#007bff', textDecoration: 'underline' }}>
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}

export default Login;
