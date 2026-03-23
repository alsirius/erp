const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

async function updateAdminPassword() {
  try {
    const password = 'Test1234@@';
    const hash = await bcrypt.hash(password, 12);
    console.log('Generated hash:', hash);
    
    // Update database
    const db = new Database('./backend/database/siriux.db');
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?');
    const result = stmt.run(hash, 'admin@siriux.com');
    
    console.log('Update result:', result);
    console.log('Admin password updated successfully!');
    
    db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdminPassword();
