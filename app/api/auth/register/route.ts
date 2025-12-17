import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

    // Vérification longueur mot de passe (minimum 5 caractères)
    if (password.length < 5) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 5 caractères' },
        { status: 400 }
      )
    }

    // Vérification email unique
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Création de l'utilisateur uniquement (sans établissement)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      {
        message: 'Utilisateur créé avec succès',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur inscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
