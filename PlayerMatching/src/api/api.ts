import axios from "axios"

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api", // Ensure this matches your backend URL
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add the auth token to headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["x-auth-token"] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default API
