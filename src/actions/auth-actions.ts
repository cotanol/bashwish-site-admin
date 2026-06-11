'use server'
import prisma from '@/libs/prisma'
import bcrypt from 'bcrypt'

// Estado que se devolvera
type FormState = {
  message: string
  error?: boolean
} | null

export async function registerUser(prevState: FormState, formData: FormData): Promise<FormState> {
  const userName = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!userName || !email || !password) {
    return { message: 'All fields are required', error: true }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      return { message: 'Email already in use', error: true }
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        name: userName,
        email: email,
        password: hashedPassword
      }
    })
    return { message: 'User created successfully!' }
  } catch (error) {
    return { message: 'Something went wrong, please try again', error: true }
  }
}
