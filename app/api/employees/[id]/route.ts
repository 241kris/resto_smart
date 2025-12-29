import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { uploadImageToSupabase } from '@/lib/uploadImage'
import { compressImage } from '@/lib/compressImage'
import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Fonction helper pour supprimer un fichier de Supabase
 */
async function deleteFileFromSupabase(fileUrl: string) {
  try {
    const url = new URL(fileUrl)
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)

    if (pathMatch) {
      const bucket = pathMatch[1]
      const filePath = pathMatch[2]

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Erreur suppression fichier Supabase:', error)
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error)
  }
}

/**
 * GET /api/employees/:id
 * Récupérer un employé par son ID
 */
export async function GET(
  request: NextRequest,
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

    // Récupérer l'employé avec ses documents et planning assigné
    const employee = await prisma.employee.findFirst({
      where: {
        id,
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
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { employee },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération employé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'employé' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/employees/:id
 * Modifier un employé
 */
export async function PUT(
  request: NextRequest,
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

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

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

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
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

    // Traitement de l'avatar si modifié
    let avatarUrl = existingEmployee.avatar

    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        // Supprimer l'ancien avatar
        if (existingEmployee.avatar) {
          await deleteFileFromSupabase(existingEmployee.avatar)
        }
        avatarUrl = null
      } else {
        const isBase64 = avatar.startsWith('data:')
        const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://')

        if (isBase64) {
          const imageRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/
          if (!imageRegex.test(avatar)) {
            return NextResponse.json(
              { error: 'Format d\'avatar invalide. Formats acceptés: JPEG, JPG, PNG, WEBP' },
              { status: 400 }
            )
          }

          const base64Length = avatar.split(',')[1]?.length || 0
          const sizeInBytes = (base64Length * 3) / 4
          const sizeInMB = sizeInBytes / (1024 * 1024)

          if (sizeInMB > 3) {
            return NextResponse.json(
              { error: 'L\'avatar ne doit pas dépasser 3 Mo' },
              { status: 400 }
            )
          }

          try {
            const compressedImage = await compressImage(avatar, 40)
            const fileName = `avatar-${nanoid(16)}.webp`
            const newAvatarUrl = await uploadImageToSupabase(compressedImage, 'avatar_employee', fileName)

            // Supprimer l'ancien avatar
            if (existingEmployee.avatar) {
              await deleteFileFromSupabase(existingEmployee.avatar)
            }

            avatarUrl = newAvatarUrl
          } catch (uploadError) {
            console.error('Erreur upload avatar:', uploadError)
            return NextResponse.json(
              { error: 'Erreur lors de l\'upload de l\'avatar' },
              { status: 500 }
            )
          }
        } else if (isUrl) {
          avatarUrl = avatar
        }
      }
    }

    // Mettre à jour l'employé
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address && { address: address.trim() }),
        ...(identityNumber !== undefined && { identityNumber: identityNumber?.trim() || null }),
        ...(position && { position }),
        ...(department && { department }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        ...(contractType && { contractType }),
        ...(status && { status }),
        ...(avatar !== undefined && { avatar: avatarUrl })
      }
    })

    return NextResponse.json(
      {
        message: 'Employé modifié avec succès',
        employee: updatedEmployee
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur modification employé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'employé' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/employees/:id
 * Mettre à jour le statut d'un employé
 */
export async function PATCH(
  request: NextRequest,
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

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

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

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(
      {
        message: 'Statut modifié avec succès',
        employee: updatedEmployee
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur modification statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du statut' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employees/:id
 * Supprimer un employé et tous ses documents
 */
export async function DELETE(
  request: NextRequest,
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

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

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

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      },
      include: {
        documents: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    // Supprimer l'avatar de l'employé
    if (employee.avatar) {
      await deleteFileFromSupabase(employee.avatar)
    }

    // Supprimer tous les documents de l'employé
    for (const document of employee.documents) {
      await deleteFileFromSupabase(document.fileUrl)
    }

    // Supprimer l'employé (les documents seront supprimés en cascade grâce à onDelete: Cascade)
    await prisma.employee.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Employé supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression employé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'employé' },
      { status: 500 }
    )
  }
}
