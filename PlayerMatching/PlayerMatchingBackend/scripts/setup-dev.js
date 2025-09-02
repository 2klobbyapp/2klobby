import fs from "fs"
import path from "path"

const createEnvFile = () => {
  const envContent = `# Backend Environment Variables
NODE_ENV=development
PORT=10000

# Database
MONGO_URI=your_mongodb_connection_string_here

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_jwt_secret_here

# Frontend URL (your current setup)
FRONTEND_URL=http://localhost:5000

# Admin Credentials (optional)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123

# Future deployment URLs (optional)
# NETLIFY_URL=
# VERCEL_URL=
# RENDER_EXTERNAL_URL=
`

  const envPath = path.join(process.cwd(), ".env")

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent)
    console.log("✅ .env file created! Please update the values with your actual credentials.")
  } else {
    console.log("⚠️  .env file already exists. Skipping creation.")
  }
}

console.log("🚀 Setting up development environment...")
createEnvFile()
console.log("📝 Next steps:")
console.log("1. Update .env file with your MongoDB URI and JWT secret")
console.log("2. Run: npm run dev")
console.log("3. Your backend will be available at http://localhost:10000")
console.log("4. Your frontend at localhost:5000 will be able to connect")
