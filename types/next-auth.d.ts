import 'next-auth'

declare module 'next-auth' {
  /**
   * Extends the default NextAuth `User` type
   * to match your Prisma model.
   */
  interface User {
    id: string
    role: 'admin' | 'vendor'
    // ...you can add other DB fields here if you need them
  }

  /**
   * Extends the `Session` type so that `session.user`
   * also includes the 'role'.
   */
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'admin' | 'vendor'
    }
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extiende el tipo `JWT` (token) para que incluya 'role'.
   */
  interface JWT {
    id: string
    role: 'admin' | 'vendor'
  }
}
