import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Dashboard.css';

const API_BASE_URL = 'http://localhost:3001/api';

const Dashboard = () => {
  const [form, setForm] = useState({
    full_name: '',
    department: '',
    email: '',
    phone: '',
    leave_type: 'ลาป่วย',
    reason: '',
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterLeaveType, setFilterLeaveType] = useState(''); // ✅ ตัวกรองประเภทการลา

  // ฟังก์ชันดึงข้อมูลพร้อมกรองและเรียง
  const fetchLeaves = async (search = '', date = '', sort = 'desc', type = '') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/leave-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { search, date, sort, type },
      });
      setLeaveRequests(res.data);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  // ดึงข้อมูลทุกครั้งที่ตัวกรองเปลี่ยน
  useEffect(() => {
    fetchLeaves(searchTerm, searchDate, sortOrder, filterLeaveType);
  }, [searchTerm, searchDate, sortOrder, filterLeaveType]);

  const validateLeave = () => {
    const today = new Date();
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24) + 1;

    if (!form.full_name.trim()) return setError('กรุณากรอกชื่อ - นามสกุล'), false;
    if (!form.phone.trim()) return setError('กรุณากรอกเบอร์โทรศัพท์'), false;
    if (!form.reason.trim()) return setError('กรุณาระบุสาเหตุการลา'), false;
    if (!form.start_date || !form.end_date) return setError('กรุณาระบุวันที่ลาตั้งแต่ - ถึง'), false;
    if (start < new Date(today.toDateString())) return setError('ไม่อนุญาตให้ลาย้อนหลัง'), false;

    if (form.leave_type === 'พักร้อน') {
      const diffStart = (start - today) / (1000 * 60 * 60 * 24);
      if (diffStart < 3) return setError('ลาพักร้อนต้องลาล่วงหน้าอย่างน้อย 3 วัน'), false;
      if (diffDays > 2) return setError('ลาพักร้อนติดต่อกันได้ไม่เกิน 2 วัน'), false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLeave()) return;

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        department: form.department.trim() || null,
        email: form.email.trim() || null,
      };
      await axios.post(`${API_BASE_URL}/leave-requests`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      alert('บันทึกรายการลาสำเร็จ');
      setForm({ full_name: '', department: '', email: '', phone: '', leave_type: 'ลาป่วย', reason: '', start_date: '', end_date: '' });
      fetchLeaves(searchTerm, searchDate, sortOrder, filterLeaveType);
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/leave-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLeaves(searchTerm, searchDate, sortOrder, filterLeaveType);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    if (currentStatus !== 'รอพิจารณา') {
      alert('สามารถพิจารณาได้เฉพาะรายการที่รอพิจารณา');
      return;
    }
    const newStatus = window.prompt('พิมพ์สถานะใหม่ (อนุมัติ/ไม่อนุมัติ):');
    if (!['อนุมัติ', 'ไม่อนุมัติ'].includes(newStatus)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/leave-requests/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLeaves(searchTerm, searchDate, sortOrder, filterLeaveType);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div>
      <h2>ยื่นคำขอลา</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          name="full_name"
          placeholder="ชื่อ-นามสกุล"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          name="department"
          placeholder="แผนก"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
        <input
          name="email"
          placeholder="อีเมล"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          name="phone"
          placeholder="เบอร์โทร"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <select
          name="leave_type"
          value={form.leave_type}
          onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
        >
          <option value="ลาป่วย">ลาป่วย</option>
          <option value="ลากิจ">ลากิจ</option>
          <option value="พักร้อน">พักร้อน</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>
        <textarea
          name="reason"
          placeholder="เหตุผล"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
        <input
          type="date"
          name="end_date"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
        />
        <button type="submit">ส่งคำขอ</button>
      </form>

      <h3>ค้นหาและเรียงลำดับ</h3>
      <input
        type="text"
        placeholder="ค้นหาชื่อ"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <input
        type="date"
        value={searchDate}
        onChange={(e) => setSearchDate(e.target.value)}
      />
      {/* <select
        value={filterLeaveType}
        onChange={(e) => setFilterLeaveType(e.target.value)}
      >
        <option value="">ทุกประเภท</option>
        <option value="ลาป่วย">ลาป่วย</option>
        <option value="ลากิจ">ลากิจ</option>
        <option value="พักร้อน">พักร้อน</option>
        <option value="อื่นๆ">อื่นๆ</option>
      </select> */}
      <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
        เรียง {sortOrder === 'asc' ? 'เก่า > ใหม่' : 'ใหม่ > เก่า'}
      </button>

      <ul>
        {leaveRequests.map((leave) => (
          <li key={leave.id}>
            <strong>{leave.full_name}</strong> - {leave.leave_type} ({leave.start_date} ถึง {leave.end_date}) - สถานะ: {leave.status || 'รอพิจารณา'}
            <button onClick={() => handleDelete(leave.id)}>ลบ</button>
            <button onClick={() => handleStatusUpdate(leave.id, leave.status)}>พิจารณา</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
