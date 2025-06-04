const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret_key'; // เปลี่ยนเองให้ยากและปลอดภัย

app.use(cors());
app.use(express.json());

// สร้าง pool เชื่อมต่อฐานข้อมูล
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Zaapoopo@0000',
  database: 'Smartleave',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware ตรวจสอบ token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ลงทะเบียน
app.post('/api/register', async (req, res) => {
  const { username, password, full_name, email, phone, department } = req.body;
  if (!username || !password || !full_name || !phone) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password_hash, full_name, email, phone, department) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, email || null, phone, department || null]
    );

    res.json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// เข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// ตัวอย่าง route ที่ต้องล็อกอิน
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, full_name, email, phone, department, role FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

//... โค้ดอื่นๆ เหมือนเดิม

// ดึงรายการลาหยุด พร้อม search by full_name, date, และ sort by created_at
app.get('/api/leave-requests', authenticateToken, async (req, res) => {
  try {
    const { search = '', date = '', sort = 'desc' } = req.query;

    let sql = `SELECT * FROM leave_requests WHERE user_id = ?`;
    let params = [req.user.id];

    if (search) {
      sql += ` AND full_name LIKE ?`;
      params.push(`%${search}%`);
    }

    if (date) {
      sql += ` AND (start_date = ? OR end_date = ?)`;
      params.push(date, date);
    }

    sql += ` ORDER BY created_at ${sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// บันทึกลาหยุด พร้อมเช็คเงื่อนไข
app.post('/api/leave-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      department,
      email,
      phone,
      leave_type = 'อื่นๆ',
      reason,
      start_date,
      end_date
    } = req.body;

    if (!full_name || !phone || !reason || !start_date || !end_date) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      return res.status(400).json({ message: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' });
    }

    if (startDate < today) {
      return res.status(400).json({ message: 'ไม่อนุญาตให้ลาย้อนหลัง' });
    }

    if (leave_type === 'พักร้อน') {
      const diffDays = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        return res.status(400).json({ message: 'ลาพักร้อนต้องลาล่วงหน้าอย่างน้อย 3 วัน' });
      }
      const leaveDuration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      if (leaveDuration > 2) {
        return res.status(400).json({ message: 'ลาพักร้อนติดต่อกันได้ไม่เกิน 2 วัน' });
      }
    }

    await pool.query(
      `INSERT INTO leave_requests 
       (user_id, full_name, department, email, phone, leave_type, reason, start_date, end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'รอพิจารณา')`,
      [userId, full_name, department || null, email || null, phone, leave_type, reason, start_date, end_date]
    );

    res.json({ message: 'บันทึกรายการลาสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// ลบรายการลาหยุด (แสดง confirm ใน frontend)
app.delete('/api/leave-requests/:id', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ? AND user_id = ?', [leaveId, req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการลาหรือไม่มีสิทธิ์ลบ' });
    }
    await pool.query('DELETE FROM leave_requests WHERE id = ?', [leaveId]);
    res.json({ message: 'ลบรายการลาสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// อัปเดตสถานะการลา เฉพาะสถานะ "รอพิจารณา" เท่านั้น
app.put('/api/leave-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status } = req.body;

    if (!['รอพิจารณา', 'อนุมัติ', 'ไม่อนุมัติ'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ? AND user_id = ?', [leaveId, req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการลาหรือไม่มีสิทธิ์แก้ไข' });
    }

    const leave = rows[0];
    if (leave.status !== 'รอพิจารณา') {
      return res.status(400).json({ message: 'ไม่สามารถแก้ไขสถานะได้ เนื่องจากสถานะไม่ใช่ "รอพิจารณา"' });
    }

    await pool.query('UPDATE leave_requests SET status = ? WHERE id = ?', [status, leaveId]);
    res.json({ message: 'อัปเดตสถานะสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

app.patch('/api/leave-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status } = req.body;

    if (!['รอพิจารณา', 'อนุมัติ', 'ไม่อนุมัติ'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ? AND user_id = ?', [leaveId, req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการลาหรือไม่มีสิทธิ์แก้ไข' });
    }

    const leave = rows[0];
    if (leave.status !== 'รอพิจารณา') {
      return res.status(400).json({ message: 'ไม่สามารถแก้ไขสถานะได้ เนื่องจากสถานะไม่ใช่ "รอพิจารณา"' });
    }

    await pool.query('UPDATE leave_requests SET status = ? WHERE id = ?', [status, leaveId]);
    res.json({ message: 'อัปเดตสถานะสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
