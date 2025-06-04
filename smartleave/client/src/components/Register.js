import React, { useState } from 'react';
import { register } from '../api';  // สมมติว่ามีฟังก์ชัน register ใน api.js
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    department: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      alert('สมัครสมาชิกสำเร็จ!');
      navigate('/login');  // พอสมัครสำเร็จ ให้ไปหน้า Login เลย
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>สมัครสมาชิก</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username *"
          value={form.username}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password *"
          value={form.password}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="full_name"
          placeholder="ชื่อ-นามสกุล *"
          value={form.full_name}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="email"
          name="email"
          placeholder="อีเมล"
          value={form.email}
          onChange={handleChange}
        />
        <br />
        <input
          name="phone"
          placeholder="เบอร์โทรศัพท์ *"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="department"
          placeholder="สังกัด/ตำแหน่ง"
          value={form.department}
          onChange={handleChange}
        />
        <br />
        <button type="submit">สมัครสมาชิก</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p>มีบัญชีแล้ว? <Link to="/login">ไปหน้าเข้าสู่ระบบ</Link></p>
    </div>
  );
}

export default Register;
