import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as User from '../models/userModel.js';

export async function setupStatus(_req, res, next) {
  try { res.json({ data: { setup_required: (await User.countUsers()) === 0 } }); }
  catch (error) { next(error); }
}

function issueToken(user) {
  if (!jwtSecretConfigured()) {
    throw new Error('Configura un JWT_SECRET de al menos 32 caracteres en backend/.env antes de iniciar sesion.');
  }
  const payload = { id: user.id, email: user.email, role: user.role, name: user.full_name };
  return { token: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }), user: payload };
}

function jwtSecretConfigured() {
  return Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32 && !process.env.JWT_SECRET.startsWith('replace-'));
}

export async function setupAdmin(req, res, next) {
  try {
    if (!jwtSecretConfigured()) return res.status(503).json({ error: { message: 'Configura un JWT_SECRET propio de al menos 32 caracteres en backend/.env antes de crear el administrador.', code: 'JWT_NOT_CONFIGURED' } });
    const { full_name, email, password } = req.body;
    if (!full_name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ error: { message: 'Completa nombre, correo y una clave de al menos 8 caracteres.', code: 'INVALID_INPUT' } });
    }
    if (await User.countUsers() > 0) {
      return res.status(409).json({ error: { message: 'La configuracion inicial ya se realizo. Inicia sesion.', code: 'ALREADY_CONFIGURED' } });
    }
    const user = await User.createAdmin({ fullName: full_name.trim(), email: email.trim().toLowerCase(), passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ data: issueToken(user) });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    if (!jwtSecretConfigured()) return res.status(503).json({ error: { message: 'Configura un JWT_SECRET propio de al menos 32 caracteres en backend/.env antes de iniciar sesion.', code: 'JWT_NOT_CONFIGURED' } });
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    if (!email || !password) return res.status(400).json({ error: { message: 'Escribe correo y clave.', code: 'INVALID_INPUT' } });
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: { message: 'Correo o clave incorrectos.', code: 'INVALID_CREDENTIALS' } });
    }
    res.json({ data: issueToken(user) });
  } catch (error) { next(error); }
}

export function me(req, res) { res.json({ data: req.user }); }
