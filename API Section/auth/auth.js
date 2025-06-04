function simpleAuth(req, res, next) {
  const token = req.headers.authorization;
  if (token === 'secret') {
    next();
  } else {
    res.status(401).json({ error: 'Yetkisiz erişim' });
  }
}
module.exports = simpleAuth;
