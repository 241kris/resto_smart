import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { uploadImageToSupabase } from '@/lib/uploadImage'
import { compressImage } from '@/lib/compressImage'
import { nanoid } from 'nanoid'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

// GET - Récupérer tous les produits de l'établissement
export async function GET() {
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

    // 🔍 DEBUG: Vérifier si l'établissement est trouvé
    console.log('🔍 GET /api/products - User trouvé:', {
      userId: user?.id,
      email: user?.email,
      hasEstablishment: !!user?.establishment,
      establishmentId: user?.establishment?.id,
      establishmentName: user?.establishment?.name
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les produits avec leur catégorie
    const products = await prisma.product.findMany({
      where: {
        establishmentId: user.establishment.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      { products },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération produits:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau produit
export async function POST(request: Request) {
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

    const body = await request.json()
    const { name, description, price, categoryId, image, isQuantifiable, quantity } = body

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      )
    }

    if (price === undefined || price === null || price < 0) {
      return NextResponse.json(
        { error: 'Le prix doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Validation de la gestion des stocks
    if (isQuantifiable && quantity !== undefined && quantity < 0) {
      return NextResponse.json(
        { error: 'La quantité ne peut pas être négative' },
        { status: 400 }
      )
    }

    // Validation de l'image si présente
    if (image) {
      const isBase64 = image.startsWith('data:')
      const isUrl = image.startsWith('http://') || image.startsWith('https://')

      if (!isBase64 && !isUrl) {
        return NextResponse.json(
          { error: 'Format d\'image invalide. Veuillez fournir une URL valide ou un fichier image.' },
          { status: 400 }
        )
      }

      // Valider le format base64
      if (isBase64) {
        const imageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
        if (!imageRegex.test(image)) {
          return NextResponse.json(
            { error: 'Format d\'image invalide. Formats acceptés: JPEG, JPG, PNG, GIF, WEBP' },
            { status: 400 }
          )
        }

        // Vérifier la taille (max 3MB)
        const base64Length = image.split(',')[1]?.length || 0
        const sizeInBytes = (base64Length * 3) / 4
        const sizeInMB = sizeInBytes / (1024 * 1024)

        if (sizeInMB > 3) {
          return NextResponse.json(
            { error: 'L\'image ne doit pas dépasser 3 Mo' },
            { status: 400 }
          )
        }
      }
    }

    // Vérifier que la catégorie existe si spécifiée
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          establishmentId: user.establishment.id,
          deleted: false
        }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Catégorie introuvable' },
          { status: 404 }
        )
      }
    }

    // Traitement de l'image
    let imageUrl = null

    if (image) {
      const isBase64 = image.startsWith('data:')
      const isUrl = image.startsWith('http://') || image.startsWith('https://')

      if (isUrl) {
        // Si c'est une URL, l'utiliser directement
        imageUrl = image
      } else if (isBase64) {
        // Si c'est un fichier base64, compresser et uploader sur Supabase
        try {
          const compressedImage = await compressImage(image, 40) // 40% de qualité
          const fileName = `product-${nanoid(16)}.webp`
          imageUrl = await uploadImageToSupabase(compressedImage, 'products', fileName)
        } catch (uploadError) {
          console.error('Erreur upload image:', uploadError)
          return NextResponse.json(
            { error: 'Erreur lors de l\'upload de l\'image' },
            { status: 500 }
          )
        }
      }
    }

    // Créer le produit avec transaction pour gérer l'historique de ravitaillement
    const product = await prisma.$transaction(async (tx) => {
      // 1. Créer le produit
      const newProduct = await tx.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          categoryId: categoryId || null,
          image: imageUrl,
          establishmentId: user.establishment!.id,
          isQuantifiable: isQuantifiable || false,
          quantity: isQuantifiable && quantity !== undefined ? parseInt(quantity) : null
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // 2. Si le produit est quantifiable et qu'une quantité est fournie, créer l'historique
      if (isQuantifiable && quantity !== undefined && quantity > 0) {
        await tx.restockHistory.create({
          data: {
            productId: newProduct.id,
            quantity: parseInt(quantity)
          }
        })
      }

      return newProduct
    })

    return NextResponse.json(
      {
        message: 'Produit créé avec succès',
        product
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    )
  }
}
