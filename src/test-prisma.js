require('dotenv').config({ path: '../.env' }); // Adjust path to .env
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL); // Debug environment variable
    const users = await prisma.user.findMany(); // Test connection with User model
    console.log('Users:', users);
  } catch (error) {
    console.error(
      'Error connecting to the database or querying models:',
      error,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main();
