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

// Fonction pour générer un slug à partir d'un nom
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, '') // Supprime les tirets au début et à la fin
}

// GET - Récupérer l'établissement de l'utilisateur connecté
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

    // Récupération de l'établissement
    const establishment = await prisma.establishment.findUnique({
      where: { userId }
    })

    if (!establishment) {
      return NextResponse.json(
        { establishment: null },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { establishment },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération établissement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'établissement' },
      { status: 500 }
    )
  }
}

// POST - Créer ou mettre à jour l'établissement
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

    const body = await request.json()
    const {
      name,
      description,
      email,
      phones,
      images,
      address,
      latitude,
      longitude
    } = body

    // Validation des champs requis
    if (!name || !phones || !address) {
      return NextResponse.json(
        { error: 'Nom, téléphone(s) et adresse sont requis' },
        { status: 400 }
      )
    }

    // Validation phones (doit être un array)
    if (!Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un numéro de téléphone est requis' },
        { status: 400 }
      )
    }

    // Validation images (max 7)
    if (images && (!Array.isArray(images) || images.length > 7)) {
      return NextResponse.json(
        { error: 'Maximum 7 images autorisées' },
        { status: 400 }
      )
    }

    // Vérifier si l'établissement existe déjà
    const existingEstablishment = await prisma.establishment.findUnique({
      where: { userId }
    })

    // Traitement des images
    let imageUrls: string[] = []

    if (images && Array.isArray(images)) {
      for (const image of images) {
        // Vérifier si c'est une URL existante
        const isExistingUrl = image.startsWith('http://') || image.startsWith('https://')

        if (isExistingUrl) {
          // C'est une URL existante, on la garde
          imageUrls.push(image)
        } else {
          // C'est une nouvelle image en base64
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
              { error: 'Chaque image ne doit pas dépasser 3 Mo' },
              { status: 400 }
            )
          }

          // Compresser l'image avant l'upload
          try {
            const compressedImage = await compressImage(image, 40) // 40% de qualité pour ~60% de réduction

            // Upload de l'image compressée
            const fileName = `establishment-${userId}-${nanoid(10)}.webp`
            const imageUrl = await uploadImageToSupabase(compressedImage, 'establishments', fileName)
            imageUrls.push(imageUrl)
          } catch (uploadError) {
            console.error('Erreur upload image:', uploadError)
            return NextResponse.json(
              { error: 'Erreur lors de l\'upload d\'une image' },
              { status: 500 }
            )
          }
        }
      }
    }

    // Supprimer les anciennes images qui ne sont plus utilisées
    if (existingEstablishment) {
      const oldImages = existingEstablishment.images as string[] || []
      for (const oldImage of oldImages) {
        if (!imageUrls.includes(oldImage)) {
          try {
            const oldFileName = oldImage.split('/').pop()
            if (oldFileName) {
              await deleteImageFromSupabase('establishments', oldFileName)
            }
          } catch (deleteError) {
            console.error('Erreur suppression ancienne image:', deleteError)
          }
        }
      }
    }

    let establishment

    if (existingEstablishment) {
      // Mise à jour
      const updateData: any = {
        name,
        description: description || null,
        email: email || null,
        phones,
        images: imageUrls,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }

      // Mettre à jour le slug si le nom a changé OU si le slug n'existe pas encore
      if (name !== existingEstablishment.name || !existingEstablishment.slug) {
        updateData.slug = generateSlug(name)
      }

      establishment = await prisma.establishment.update({
        where: { userId },
        data: updateData
      })
    } else {
      // Création - générer un slug
      const slug = generateSlug(name)

      establishment = await prisma.establishment.create({
        data: {
          name,
          slug,
          description: description || null,
          email: email || null,
          phones,
          images: imageUrls,
          address,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          userId
        }
      })
    }

    return NextResponse.json(
      {
        message: existingEstablishment ? 'Établissement mis à jour' : 'Établissement créé',
        establishment
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur création/mise à jour établissement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création/mise à jour de l\'établissement' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour partiellement l'établissement
export async function PUT(request: Request) {
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

    const body = await request.json()

    // Vérifier si l'établissement existe
    const existingEstablishment = await prisma.establishment.findUnique({
      where: { userId }
    })

    if (!existingEstablishment) {
      return NextResponse.json(
        { error: 'Établissement introuvable' },
        { status: 404 }
      )
    }

    // Construire les données de mise à jour (uniquement les champs fournis)
    const updateData: any = {}

    if (body.name !== undefined) {
      updateData.name = body.name
      updateData.slug = generateSlug(body.name)
    }
    if (body.description !== undefined) updateData.description = body.description
    if (body.email !== undefined) updateData.email = body.email
    if (body.phones !== undefined) {
      if (!Array.isArray(body.phones) || body.phones.length === 0) {
        return NextResponse.json(
          { error: 'Au moins un numéro de téléphone est requis' },
          { status: 400 }
        )
      }
      updateData.phones = body.phones
    }
    if (body.address !== undefined) {
      updateData.address = body.address
    }
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null

    // Traitement des images si fournies
    if (body.images !== undefined) {
      if (!Array.isArray(body.images) || body.images.length > 7) {
        return NextResponse.json(
          { error: 'Maximum 7 images autorisées' },
          { status: 400 }
        )
      }

      const imageUrls: string[] = []
      for (const image of body.images) {
        const isExistingUrl = image.startsWith('http://') || image.startsWith('https://')

        if (isExistingUrl) {
          imageUrls.push(image)
        } else {
          // Upload nouvelle image
          const imageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
          if (!imageRegex.test(image)) {
            return NextResponse.json(
              { error: 'Format d\'image invalide' },
              { status: 400 }
            )
          }

          try {
            // Compresser l'image avant l'upload
            const compressedImage = await compressImage(image, 40)

            const fileName = `establishment-${userId}-${nanoid(10)}.webp`
            const imageUrl = await uploadImageToSupabase(compressedImage, 'establishments', fileName)
            imageUrls.push(imageUrl)
          } catch (uploadError) {
            console.error('Erreur upload image:', uploadError)
            return NextResponse.json(
              { error: 'Erreur lors de l\'upload d\'une image' },
              { status: 500 }
            )
          }
        }
      }

      // Supprimer les anciennes images non utilisées
      const oldImages = existingEstablishment.images as string[] || []
      for (const oldImage of oldImages) {
        if (!imageUrls.includes(oldImage)) {
          try {
            const oldFileName = oldImage.split('/').pop()
            if (oldFileName) {
              await deleteImageFromSupabase('establishments', oldFileName)
            }
          } catch (deleteError) {
            console.error('Erreur suppression ancienne image:', deleteError)
          }
        }
      }

      updateData.images = imageUrls
    }

    const establishment = await prisma.establishment.update({
      where: { userId },
      data: updateData
    })

    return NextResponse.json(
      {
        message: 'Établissement mis à jour',
        establishment
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur mise à jour établissement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'établissement' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer l'établissement
export async function DELETE() {
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

    // Récupérer l'établissement pour supprimer les images
    const establishment = await prisma.establishment.findUnique({
      where: { userId }
    })

    if (!establishment) {
      return NextResponse.json(
        { error: 'Établissement introuvable' },
        { status: 404 }
      )
    }

    // Supprimer toutes les images
    const images = establishment.images as string[] || []
    for (const image of images) {
      try {
        const fileName = image.split('/').pop()
        if (fileName) {
          await deleteImageFromSupabase('establishments', fileName)
        }
      } catch (deleteError) {
        console.error('Erreur suppression image:', deleteError)
      }
    }

    // Supprimer l'établissement (cascade sur les relations)
    await prisma.establishment.delete({
      where: { userId }
    })

    return NextResponse.json(
      { message: 'Établissement supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression établissement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'établissement' },
      { status: 500 }
    )
  }
}
