const express = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { prisma } = require('../lib/prisma')

const router = express.Router()

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res) => {
  const { email, password, name } = RegisterSchema.parse(req.body)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hash, name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  res.status(201).json(user)
})

router.post('/login', async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
})

module.exports = router
