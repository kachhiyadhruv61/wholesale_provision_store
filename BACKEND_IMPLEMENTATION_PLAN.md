# ⚡ Quick Start: Backend Implementation Plan

## 🎯 Fastest Path to Production (2 Options)

---

## OPTION 1: Firebase/Supabase (FASTEST - 2 weeks)

### Advantages
- ✅ No server maintenance needed
- ✅ Built-in authentication
- ✅ Real-time database
- ✅ File storage included
- ✅ Automatic scaling
- ✅ Free tier available (up to ₹5000/month product cost)

### Setup Steps

#### Step 1: Create Supabase Project (5 mins)
```bash
# Go to https://supabase.com
# Create free account
# Create new project → Copy connection string
```

#### Step 2: Install Frontend Packages (10 mins)
```bash
cd Frontend
npm install @supabase/supabase-js axios dotenv
```

#### Step 3: Create API Service Layer (30 mins)
```javascript
// src/services/api.js
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// Axios instance for REST APIs
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### Step 4: Create .env File (5 mins)
```bash
# Frontend/.env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_KEY=eyJhb... (your key)
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_RAZORPAY_KEY=rzp_live_xxxxx
```

#### Step 5: Replace LocalStorage with API Calls (1 week)
Replace each context one by one:

**Before (UserContext.jsx):**
```javascript
const loginUser = (username, email) => {
  const userData = { id: Date.now(), username, email, ... }
  setUser(userData)
  localStorage.setItem("user", JSON.stringify(userData))
}
```

**After (with API):**
```javascript
const loginUser = async (username, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    })
    if (error) throw error
    setUser(data.user)
    localStorage.setItem('authToken', data.session.access_token)
  } catch (error) {
    console.error('Login failed:', error.message)
  }
}
```

### Database Schema (SQL)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  wholesale_price DECIMAL(10, 2),
  stock INT DEFAULT 0,
  moq INT DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity INT,
  price DECIMAL(10, 2)
);

-- Payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Timeline & Cost
- Setup: 2 hours
- API integration: 1 week
- Testing: 3 days
- Total: 10 days
- Monthly cost: ₹0-10,000 (based on usage)

---

## OPTION 2: Node.js + Express (RECOMMENDED - 4 weeks)

### Advantages
- ✅ Full control over backend
- ✅ Easier to extend
- ✅ Better for complex logic
- ✅ Cost-effective
- ✅ Developer-friendly

### Project Setup

#### Initialize Backend Project
```bash
# In root folder
mkdir backend
cd backend
npm init -y

npm install express cors dotenv mongoose bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

#### Package.json scripts
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

#### Basic Express Server (backend/index.js)
```javascript
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/products', require('./routes/products'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/payments', require('./routes/payments'))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

#### Auth Routes (backend/routes/auth.js)
```javascript
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, shop_name } = req.body
    
    // Check if user exists
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'User already exists' })
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      shop_name
    })
    await user.save()
    
    res.json({ success: true, user: { id: user._id, email: user.email } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' })
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })
    
    res.json({ token, user: { id: user._id, email: user.email } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
```

#### Middleware for Protected Routes
```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

### Frontend Integration

#### Step 1: Update UserContext with API
```javascript
// src/context/UserContext.jsx
import { apiClient } from '../services/api'

const loginUser = async (email, password) => {
  try {
    const { data } = await apiClient.post('/auth/login', { email, password })
    localStorage.setItem('authToken', data.token)
    setUser(data.user)
    return data
  } catch (error) {
    alert('Login failed: ' + error.response?.data?.error)
  }
}
```

#### Step 2: Update ProductContext
```javascript
const [products, setProducts] = useState([])

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/products')
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }
  fetchProducts()
}, [])
```

### Deploy to Cloud (Choose One)

#### A. Heroku (Simplest)
```bash
# Install Heroku CLI
heroku login
heroku create my-dktrade-api
git push heroku main
```

#### B. DigitalOcean App Platform
- Connect GitHub repo
- Set environment variables
- Auto-deploy on push

#### C. AWS EC2
- Launch Ubuntu instance
- Install Node.js + MongoDB
- Set up PM2 for process management

### Timeline & Cost
- Setup: 1-2 days
- API development: 2-3 weeks
- Testing & debugging: 3-5 days
- Deployment: 1-2 days
- Total: 3-4 weeks
- Monthly cost: ₹500-3000 (for hosting)

---

## Payment Gateway Integration

### Razorpay Setup (Recommended for India)

#### Frontend (React)
```javascript
// Install
npm install razorpay

// In Checkout.jsx
const handlePayment = async (amount) => {
  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  })
  
  const { order } = await response.json()
  
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY,
    amount: order.amount,
    currency: "INR",
    name: "DK TRADERS",
    order_id: order.id,
    handler: function(response) {
      verifyPayment(response)
    }
  }
  
  const rzp = new window.Razorpay(options)
  rzp.open()
}
```

#### Backend (Node.js)
```javascript
const Razorpay = require('razorpay')

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
})

// Create order
router.post('/payments/initiate', async (req, res) => {
  const order = await rzp.orders.create({
    amount: req.body.amount * 100,
    currency: 'INR'
  })
  res.json({ order })
})

// Verify payment
router.post('/payments/verify', async (req, res) => {
  const valid = rzp.payments.fetch(req.body.razorpay_payment_id)
  if (valid.status === 'captured') {
    // Update order payment status
    res.json({ success: true })
  }
})
```

---

## Email Integration

### Using NodeMailer or SendGrid

```javascript
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendOrderConfirmation = async (email, order) => {
  const msg = {
    to: email,
    from: 'orders@dktrade.com',
    subject: `Order Confirmed #${order.id}`,
    html: `<h1>Your order has been confirmed!</h1>
           <p>Order ID: ${order.id}</p>
           <p>Total: ₹${order.total}</p>`
  }
  
  await sgMail.send(msg)
}
```

---

## Testing Checklist

### Before Going Live
- [ ] All 48 API endpoints built & tested
- [ ] Authentication working (JWT tokens)
- [ ] Database operations working
- [ ] Payment gateway verified (sandbox testing)
- [ ] Frontend connected to all APIs
- [ ] Error handling implemented
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Logging setup
- [ ] Monitoring alerts configured
- [ ] Database backups scheduled
- [ ] HTTPS/SSL enabled
- [ ] Environment variables secured
- [ ] Load tested (minimum 100 concurrent users)

---

## Cost Breakdown (Monthly)

### Option 1: Supabase + Frontend Hosting
```
Supabase: ₹2000-5000
Frontend Hosting (Vercel): ₹0-2000
Domain: ₹500
Total: ₹2500-7500/month
```

### Option 2: Node.js Backend + Database
```
Backend Hosting (DigitalOcean): ₹2000-5000
Database (MongoDB Atlas): ₹1000-3000
Frontend Hosting (Vercel): ₹0-2000
Domain: ₹500
Total: ₹3500-10500/month
```

---

## Key Metrics to Track

```
Response Time: < 200ms (90th percentile)
Error Rate: < 0.1%
Uptime: > 99.5%
Payment Success Rate: > 98%
Database Query Time: < 100ms (95th percentile)
```

---

## Next Immediate Actions

1. **Day 1:** Choose between Supabase (fast) or Node.js (flexible)
2. **Day 2-3:** Set up backend project and database
3. **Day 4-7:** Build core APIs (Auth, Products, Orders)
4. **Week 2:** Integrate payment gateway (Razorpay)
5. **Week 2-3:** Connect frontend to APIs one by one
6. **Week 3-4:** Testing and bug fixes
7. **Week 4:** Deploy to production

---

**Good luck! You've got a solid foundation. This backend will make it production-ready! 🚀**
