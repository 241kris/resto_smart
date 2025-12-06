import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

// PUT - Mettre à jour une catégorie
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    // Récupérer l'établissement de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name } = body

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom de la catégorie est requis' },
        { status: 400 }
      )
    }

    // Vérifier que la catégorie existe et appartient à l'établissement
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id,
        deleted: false
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Catégorie introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si une autre catégorie avec ce nom existe déjà
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        establishmentId: user.establishment.id,
        name: name.trim(),
        deleted: false,
        id: { not: id }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Mettre à jour la catégorie
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim()
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    return NextResponse.json(
      {
        message: 'Catégorie mise à jour avec succès',
        category
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur mise à jour catégorie:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la catégorie' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une catégorie (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    // Récupérer l'établissement de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Vérifier que la catégorie existe et appartient à l'établissement
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id,
        deleted: false
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Catégorie introuvable' },
        { status: 404 }
      )
    }

    // Soft delete: marquer comme supprimée au lieu de supprimer réellement
    await prisma.category.update({
      where: { id },
      data: {
        deleted: true
      }
    })

    return NextResponse.json(
      { message: 'Catégorie supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression catégorie:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la catégorie' },
      { status: 500 }
    )
  }
}
