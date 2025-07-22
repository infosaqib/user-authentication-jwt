import jwt from 'jsonwebtoken';

function jwtAuth(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.redirect('/auth/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/auth/login');
  }
}

export { jwtAuth };
