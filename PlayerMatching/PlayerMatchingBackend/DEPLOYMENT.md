# Deployment Guide for Render

## Prerequisites
1. GitHub repository with your code
2. MongoDB Atlas database (or other MongoDB hosting)
3. Render account

## Environment Variables Required

Set these environment variables in your Render dashboard:

### Required
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT tokens (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

### Optional
- `FRONTEND_URL` - Your frontend URL (currently: http://localhost:5000, later: your deployed frontend URL)
- `ADMIN_USERNAME` - Admin username (default: admin)
- `ADMIN_EMAIL` - Admin email (default: admin@gmail.com)
- `ADMIN_PASSWORD` - Admin password (default: admin123)
- `NETLIFY_URL` - If deploying frontend to Netlify
- `VERCEL_URL` - If deploying frontend to Vercel

## Local Development Setup

For local development with your frontend on localhost:5000:

1. **Environment Variables** (create `.env` file):
   \`\`\`
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5000
   NODE_ENV=development
   \`\`\`

2. **Start the server**:
   \`\`\`bash
   npm run dev
   \`\`\`

Your backend will run on port 10000 (or PORT env variable) and accept requests from localhost:5000.

## Deployment Steps

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   \`\`\`

2. **Create New Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `2k-lobby-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (or paid for better performance)

3. **Set Environment Variables**
   - In your service settings, add all required environment variables
   - Make sure `MONGO_URI` points to your MongoDB Atlas cluster

4. **Deploy**
   - Render will automatically deploy when you push to your main branch
   - Monitor the build logs for any issues

5. **Create Admin User**
   - After successful deployment, you can create an admin user by running:
   - Go to your service shell and run: `npm run create-admin`

## Important Notes

- **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity
- **Database**: Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Render's IP ranges
- **CORS**: Update your frontend to use the Render URL for API calls
- **Environment Variables**: Never commit sensitive data like JWT secrets or database URLs

## Your Service URLs
After deployment, your API will be available at:
- `https://your-service-name.onrender.com`

## Testing Deployment
Test your deployment with:
\`\`\`bash
curl https://your-service-name.onrender.com/
\`\`\`

Should return: "2K Lobby Backend API is running!"
