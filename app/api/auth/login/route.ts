import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Recherche de l'utilisateur avec son établissement
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        establishment: true
      }
    })

    // Message d'erreur si l'email n'existe pas
    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cet email' },
        { status: 401 }
      )
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password)

    // Message d'erreur si le mot de passe est incorrect
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Création du token JWT avec une expiration de 3 mois (90 jours)
    const token = await new SignJWT({
      userId: user.id,
      email: user.email
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('90d') // 3 mois
      .sign(JWT_SECRET)

    // Création de la réponse avec le cookie
    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          establishmentId: user.establishment?.id
        }
      },
      { status: 200 }
    )

    // Configuration du cookie avec une durée de 3 mois
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90, // 90 jours en secondes
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Erreur connexion:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}
