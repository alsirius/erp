import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PostgresDatabaseManager } from '../database/PostgresDatabaseManager';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class UserSeeder {
  private db: PostgresDatabaseManager;

  constructor() {
    this.db = PostgresDatabaseManager.getInstance();
  }

  async seedUsers(): Promise<void> {
    console.log('🌱 Seeding users...');
    
    let client: any;
    
    try {
      // Get database client
      client = await this.db.getClient();
      
      // Clear existing users (optional - uncomment if you want clean seed)
      // await client.query('DELETE FROM users');
      
      const users = [
        {
          id: uuidv4(),
          email: 'admin@siriux.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          department: 'IT',
          isActive: true,
          emailVerified: true,
          password: 'admin123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          email: 'manager@siriux.com',
          firstName: 'Manager',
          lastName: 'User',
          role: 'manager',
          department: 'Operations',
          isActive: true,
          emailVerified: true,
          password: 'manager123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          email: 'user@siriux.com',
          firstName: 'Regular',
          lastName: 'User',
          role: 'user',
          department: 'General',
          isActive: true,
          emailVerified: true,
          password: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const user of users) {
        const passwordHash = await bcrypt.hash(user.password, 12);
        
        await client.query(`
          INSERT INTO users (
            id, email, password_hash, first_name, last_name, 
            role, department, is_active, email_verified, 
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) ON CONFLICT (email) DO NOTHING
        `, [
          user.id,
          user.email,
          passwordHash,
          user.firstName,
          user.lastName,
          user.role,
          user.department,
          user.isActive,
          user.emailVerified,
          user.createdAt,
          user.updatedAt,
        ]);

        console.log(`✅ Created ${user.role}: ${user.email} (${user.password})`);
      }

      console.log('🎉 User seeding completed!');
      console.log('\n📋 Login Credentials:');
      console.log('┌─────────────────────────────────┐');
      console.log('│ Role    │ Email              │ Password │');
      console.log('├─────────────────────────────────┤');
      console.log(`│ Admin    │ admin@siriux.com    │ admin123 │`);
      console.log(`│ Manager  │ manager@siriux.com  │ manager123│`);
      console.log(`│ User     │ user@siriux.com     │ user123  │`);
      console.log('└─────────────────────────────────┘');
      
    } catch (error) {
      console.error('❌ Failed to seed users:', error);
      throw error;
    } finally {
      // Release the client back to the pool
      try {
        if ('release' in client && typeof client.release === 'function') {
          client.release();
        }
      } catch (releaseError) {
        console.warn('Warning: Could not release database client:', releaseError);
      }
    }
  }

  async checkUsersExist(): Promise<boolean> {
    try {
      const result = await this.db.query('SELECT COUNT(*) as count FROM users');
      const count = parseInt(result.rows[0].count);
      return count > 0;
    } catch (error) {
      console.error('❌ Failed to check users:', error);
      return false;
    }
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  const seeder = new UserSeeder();
  
  seeder.seedUsers().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

export default UserSeeder;
