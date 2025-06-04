use Smartleave;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    leave_type ENUM('ลาป่วย', 'ลากิจ', 'พักร้อน', 'อื่นๆ') NOT NULL DEFAULT 'อื่นๆ',
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('รอพิจารณา', 'อนุมัติ', 'ไม่อนุมัติ') NOT NULL DEFAULT 'รอพิจารณา',
    user_id INT NOT NULL,
    CONSTRAINT fk_leave_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
