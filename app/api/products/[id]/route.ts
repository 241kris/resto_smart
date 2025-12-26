import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/uploadImage'
import { compressImage } from '@/lib/compressImage'
import { nanoid } from 'nanoid'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

// PUT - Mettre à jour un produit
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
    const { name, description, price, categoryId, image } = body

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

    // Vérifier que le produit existe et appartient à l'établissement
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // Validation de l'image si présente
    if (image && image !== existingProduct.image) {
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

    // Traitement de l'image si une nouvelle image est fournie
    let imageUrl = existingProduct.image

    if (image && image !== existingProduct.image) {
      const isBase64 = image.startsWith('data:')
      const isUrl = image.startsWith('http://') || image.startsWith('https://')

      if (isUrl) {
        // Si c'est une URL, l'utiliser directement
        imageUrl = image

        // Supprimer l'ancienne image de Supabase si c'était un upload et non une URL
        if (existingProduct.image && !existingProduct.image.startsWith('http')) {
          try {
            await deleteImageFromSupabase('products', existingProduct.image)
          } catch (deleteError) {
            console.error('Erreur suppression ancienne image:', deleteError)
          }
        }
      } else if (isBase64) {
        // Si c'est un fichier base64, compresser et uploader sur Supabase
        try {
          const compressedImage = await compressImage(image, 40)
          const fileName = `product-${nanoid(16)}.webp`
          imageUrl = await uploadImageToSupabase(compressedImage, 'products', fileName)

          // Supprimer l'ancienne image de Supabase si elle existe et n'est pas une URL
          if (existingProduct.image && !existingProduct.image.startsWith('http')) {
            try {
              await deleteImageFromSupabase('products', existingProduct.image)
            } catch (deleteError) {
              console.error('Erreur suppression ancienne image:', deleteError)
            }
          }
        } catch (uploadError) {
          console.error('Erreur upload image:', uploadError)
          return NextResponse.json(
            { error: 'Erreur lors de l\'upload de l\'image' },
            { status: 500 }
          )
        }
      }
    }

    // Mettre à jour le produit
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        categoryId: categoryId || null,
        image: imageUrl
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

    return NextResponse.json(
      {
        message: 'Produit mis à jour avec succès',
        product
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur mise à jour produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un produit
export async function DELETE(
  _request: Request,
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

    // Vérifier que le produit existe et appartient à l'établissement
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // Supprimer l'image de Supabase si elle existe et n'est pas une URL externe
    if (existingProduct.image && !existingProduct.image.startsWith('http')) {
      try {
        await deleteImageFromSupabase('products', existingProduct.image)
      } catch (deleteError) {
        console.error('Erreur suppression image:', deleteError)
        // Continue même si la suppression échoue
      }
    }

    // Supprimer le produit
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Produit supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression produit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    )
  }
}
