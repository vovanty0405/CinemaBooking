require('dotenv').config({ override: true })
const jwt = require('jsonwebtoken')

const test = async () => {
  try {
    // Generate valid token
    const token = jwt.sign(
      { id: "647b0aef9701a8ef9f88e560", role: "user" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    )

    const res = await fetch('http://localhost:3000/api/promotions/coupons/validate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: 'GIAM10K',
        cartTotal: 100000,
      })
    })
    const json = await res.json()
    console.log('Result:', json)
  } catch (err) {
    console.error('Error:', err.message)
  }
}
test()
