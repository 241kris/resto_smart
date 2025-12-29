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

/**
 * GET /api/employees
 * Récupérer tous les employés de l'établissement
 */
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

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les employés avec leurs documents et planning assigné
    const employees = await prisma.employee.findMany({
      where: {
        establishmentId: user.establishment.id
      },
      include: {
        documents: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        scheduleAssignment: {
          include: {
            schedule: {
              include: {
                days: {
                  orderBy: {
                    dayOfWeek: 'asc'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      { employees },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération employés:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des employés' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees
 * Créer un nouvel employé
 */
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
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      identityNumber,
      position,
      department,
      hireDate,
      contractType,
      status,
      avatar
    } = body

    // Validation des champs obligatoires
    if (!firstName || firstName.trim() === '') {
      return NextResponse.json(
        { error: 'Le prénom est requis' },
        { status: 400 }
      )
    }

    if (!lastName || lastName.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: 'La date de naissance est requise' },
        { status: 400 }
      )
    }

    if (!gender || !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return NextResponse.json(
        { error: 'Le sexe est requis (MALE, FEMALE, OTHER)' },
        { status: 400 }
      )
    }

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { error: 'Le numéro de téléphone est requis' },
        { status: 400 }
      )
    }

    if (!address || address.trim() === '') {
      return NextResponse.json(
        { error: 'L\'adresse est requise' },
        { status: 400 }
      )
    }

    if (!position || !['WAITER', 'COOK', 'CHEF', 'CASHIER', 'MANAGER', 'DELIVERY'].includes(position)) {
      return NextResponse.json(
        { error: 'Le poste est requis (WAITER, COOK, CHEF, CASHIER, MANAGER, DELIVERY)' },
        { status: 400 }
      )
    }

    if (!department || !['DINING_ROOM', 'KITCHEN', 'ADMINISTRATION', 'DELIVERY'].includes(department)) {
      return NextResponse.json(
        { error: 'Le département est requis (DINING_ROOM, KITCHEN, ADMINISTRATION, DELIVERY)' },
        { status: 400 }
      )
    }

    if (!hireDate) {
      return NextResponse.json(
        { error: 'La date d\'embauche est requise' },
        { status: 400 }
      )
    }

    if (!contractType || !['CDI', 'CDD', 'PART_TIME', 'DAILY_EXTRA'].includes(contractType)) {
      return NextResponse.json(
        { error: 'Le type de contrat est requis (CDI, CDD, PART_TIME, DAILY_EXTRA)' },
        { status: 400 }
      )
    }

    // Validation de l'avatar si présent
    if (avatar) {
      const isBase64 = avatar.startsWith('data:')
      const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://')

      if (!isBase64 && !isUrl) {
        return NextResponse.json(
          { error: 'Format d\'avatar invalide. Veuillez fournir une URL valide ou un fichier image.' },
          { status: 400 }
        )
      }

      // Valider le format base64
      if (isBase64) {
        const imageRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
        if (!imageRegex.test(avatar)) {
          return NextResponse.json(
            { error: 'Format d\'avatar invalide. Formats acceptés: JPEG, JPG, PNG, WEBP' },
            { status: 400 }
          )
        }

        // Vérifier la taille (max 3MB)
        const base64Length = avatar.split(',')[1]?.length || 0
        const sizeInBytes = (base64Length * 3) / 4
        const sizeInMB = sizeInBytes / (1024 * 1024)

        if (sizeInMB > 3) {
          return NextResponse.json(
            { error: 'L\'avatar ne doit pas dépasser 3 Mo' },
            { status: 400 }
          )
        }
      }
    }

    // Traitement de l'avatar
    let avatarUrl = null

    if (avatar) {
      const isBase64 = avatar.startsWith('data:')
      const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://')

      if (isUrl) {
        // Si c'est une URL, l'utiliser directement
        avatarUrl = avatar
      } else if (isBase64) {
        // Si c'est un fichier base64, compresser et uploader sur Supabase
        try {
          const compressedImage = await compressImage(avatar, 40) // 40% de qualité
          const fileName = `avatar-${nanoid(16)}.webp`
          avatarUrl = await uploadImageToSupabase(compressedImage, 'avatar_employee', fileName)
        } catch (uploadError) {
          console.error('Erreur upload avatar:', uploadError)
          return NextResponse.json(
            { error: 'Erreur lors de l\'upload de l\'avatar' },
            { status: 500 }
          )
        }
      }
    }

    // Créer l'employé (sans documents ni plannings)
    const employee = await prisma.employee.create({
      data: {
        establishmentId: user.establishment.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address.trim(),
        identityNumber: identityNumber?.trim() || null,
        position,
        department,
        hireDate: new Date(hireDate),
        contractType,
        status: status || 'ACTIVE',
        avatar: avatarUrl
      }
    })

    return NextResponse.json(
      {
        message: 'Employé créé avec succès',
        employee
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création employé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'employé' },
      { status: 500 }
    )
  }
}
