# 🏀 2K Lobby Backend

NBA 2K Player Matching Backend API with real-time messaging.

## 🚀 Quick Deploy to Render

### 1. Push to GitHub
\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### 2. Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect settings from `render.yaml`

### 3. Set Environment Variables
In your Render service settings, add these environment variables:

#### Required ✅
\`\`\`
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here
\`\`\`

#### Optional 🔧
\`\`\`
FRONTEND_URL=http://localhost:5000
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=securepassword123
\`\`\`

### 4. Deploy! 🎉
Render will automatically build and deploy your app.

## 🔧 Local Development

\`\`\`bash
# Install dependencies
npm install

# Create .env file with your variables
cp .env.example .env

# Start development server
npm run dev
\`\`\`

## 📡 API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/players` - Get all players
- `POST /api/players` - Create player profile
- `GET /api/conversations` - Get user conversations
- `POST /api/messages` - Send message

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `PORT` | Server port (auto-set by Render) | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | ❌ |
| `NODE_ENV` | Environment (auto-set to production) | ❌ |

## 🔐 Generate JWT Secret

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

## 📱 Features

- ✅ User authentication & authorization
- ✅ Player profile management
- ✅ Real-time messaging (Socket.IO)
- ✅ Admin panel
- ✅ File upload support
- ✅ Advanced filtering & search
- ✅ CORS configured for multiple origins
- ✅ Production-ready error handling

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Deployment**: Render

## 📞 Support

If you encounter any issues during deployment, check:
1. Environment variables are set correctly
2. MongoDB connection string is valid
3. JWT secret is generated and set
4. Check Render logs for detailed error messages

---

**Ready to deploy? Just push to GitHub and connect to Render!** 🚀
\`\`\`

Create an example environment file:
