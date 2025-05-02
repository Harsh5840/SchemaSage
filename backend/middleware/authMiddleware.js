
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Make sure to use a strong secret

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach the decoded user ID to the request object (or any other data)
    req.user = decoded;
    next(); // Move to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
