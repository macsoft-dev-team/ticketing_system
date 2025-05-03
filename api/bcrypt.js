// Import the bcrypt library (use bcryptjs if you installed bcryptjs)
const bcrypt = require('bcrypt');  // Change this to `bcryptjs` if you're using bcryptjs

// Get the password passed as a command-line argument
const password = process.argv[2]; // Password should be passed as the first argument
const saltRounds = 10; // Adjust salt rounds as needed

// Check if a password was passed
if (!password) {
  console.log('Please provide a password to hash.');
  process.exit(1);
}

// Hash the password
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  console.log('Hashed password:', hash);
});
