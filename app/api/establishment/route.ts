import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/uploadImage'
import { nanoid } from 'nanoid'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

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
    const { name, email, phone, address, image_cover } = body

    // Validation
    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'Nom, téléphone et adresse sont requis' },
        { status: 400 }
      )
    }

    // Validation de l'image si présente
    if (image_cover) {
      // Vérifier que c'est une image base64 valide
      const imageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
      if (!imageRegex.test(image_cover)) {
        return NextResponse.json(
          { error: 'Format d\'image invalide. Formats acceptés: JPEG, JPG, PNG, GIF, WEBP' },
          { status: 400 }
        )
      }

      // Vérifier la taille (max 3MB)
      const base64Length = image_cover.split(',')[1]?.length || 0
      const sizeInBytes = (base64Length * 3) / 4
      const sizeInMB = sizeInBytes / (1024 * 1024)

      if (sizeInMB > 3) {
        return NextResponse.json(
          { error: 'L\'image ne doit pas dépasser 3 Mo' },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'établissement existe déjà
    const existingEstablishment = await prisma.establishment.findUnique({
      where: { userId }
    })

    // Upload de l'image sur Supabase si fournie
    let imageUrl = existingEstablishment?.image_cover || null

    if (image_cover) {
      try {
        const fileName = `establishment-${userId}-${nanoid(10)}.png`
        imageUrl = await uploadImageToSupabase(image_cover, 'establishments', fileName)

        // Supprimer l'ancienne image si elle existe
        if (existingEstablishment?.image_cover) {
          try {
            const oldFileName = existingEstablishment.image_cover.split('/').pop()
            if (oldFileName) {
              await deleteImageFromSupabase('establishments', oldFileName)
            }
          } catch (deleteError) {
            console.error('Erreur suppression ancienne image:', deleteError)
            // Continue même si la suppression échoue
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

    let establishment

    if (existingEstablishment) {
      // Mise à jour
      establishment = await prisma.establishment.update({
        where: { userId },
        data: {
          name,
          email: email || null,
          phone,
          address,
          image_cover: imageUrl
        }
      })
    } else {
      // Création
      establishment = await prisma.establishment.create({
        data: {
          name,
          email: email || null,
          phone,
          address,
          image_cover: imageUrl,
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
