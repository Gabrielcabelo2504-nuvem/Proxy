import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

async function importKeys() {
  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: { rejectUnauthorized: false },
    };

    // Read keys from file
    const keysData = readFileSync('/home/ubuntu/keys_import.txt', 'utf-8');
    const keyList = keysData.split('\n').filter(line => line.trim());

    console.log(`Found ${keyList.length} keys to import`);

    // Create database connection
    connection = await mysql.createConnection(config);

    // Calculate expiration date (1 day from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    // Insert keys
    for (let i = 0; i < keyList.length; i++) {
      const code = keyList[i].trim();
      const clientName = `Client-${i + 1}`;

      const query = `
        INSERT INTO api_keys (code, clientName, status, expiresAt, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await connection.execute(query, [code, clientName, 'active', expiresAtStr, 1]);
      console.log(`✓ Imported key ${i + 1}/${keyList.length}: ${code}`);
    }

    console.log('\n✅ All keys imported successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing keys:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importKeys();
