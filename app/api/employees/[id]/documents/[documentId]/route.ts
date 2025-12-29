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
    // Extraire le chemin du fichier depuis l'URL
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
 * PUT /api/employees/:id/documents/:documentId
 * Modifier un document
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
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

    const { id, documentId } = await params

    // Vérifier que l'employé existe et appartient à l'établissement
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

    // Vérifier que le document existe et appartient à l'employé
    const existingDocument = await prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId: id
      }
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { documentType, fileName, file } = body

    // Préparer les données de mise à jour
    const updateData: any = {}

    if (documentType !== undefined) {
      if (documentType.trim() === '') {
        return NextResponse.json(
          { error: 'Le type de document ne peut pas être vide' },
          { status: 400 }
        )
      }
      updateData.documentType = documentType.trim()
    }

    if (fileName !== undefined) {
      if (fileName.trim() === '') {
        return NextResponse.json(
          { error: 'Le nom du fichier ne peut pas être vide' },
          { status: 400 }
        )
      }
      updateData.fileName = fileName.trim()
    }

    // Si un nouveau fichier est fourni
    if (file) {
      const isBase64 = file.startsWith('data:')
      const isUrl = file.startsWith('http://') || file.startsWith('https://')

      if (!isBase64 && !isUrl) {
        return NextResponse.json(
          { error: 'Format de fichier invalide' },
          { status: 400 }
        )
      }

      let newFileUrl = null

      if (isUrl) {
        newFileUrl = file
      } else if (isBase64) {
        // Vérifier la taille (max 5MB)
        const base64Length = file.split(',')[1]?.length || 0
        const sizeInBytes = (base64Length * 3) / 4
        const sizeInMB = sizeInBytes / (1024 * 1024)

        if (sizeInMB > 5) {
          return NextResponse.json(
            { error: 'Le fichier ne doit pas dépasser 5 Mo' },
            { status: 400 }
          )
        }

        // Déterminer le type de fichier
        const mimeTypeMatch = file.match(/^data:([^;]+);base64,/)
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/pdf'

        // Compresser si c'est une image
        let fileToUpload = file
        if (mimeType.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(file, 60)
          } catch (error) {
            console.error('Erreur compression:', error)
          }
        }

        // Upload sur Supabase
        try {
          const extension = mimeType.split('/')[1] || 'pdf'
          const uniqueFileName = `document-${nanoid(16)}.${extension}`
          newFileUrl = await uploadImageToSupabase(fileToUpload, 'employee_documents', uniqueFileName)
        } catch (uploadError) {
          console.error('Erreur upload fichier:', uploadError)
          return NextResponse.json(
            { error: 'Erreur lors de l\'upload du fichier' },
            { status: 500 }
          )
        }
      }

      // Supprimer l'ancien fichier si l'URL a changé
      if (newFileUrl && newFileUrl !== existingDocument.fileUrl) {
        await deleteFileFromSupabase(existingDocument.fileUrl)
        updateData.fileUrl = newFileUrl
      }
    }

    // Mettre à jour le document
    const updatedDocument = await prisma.employeeDocument.update({
      where: { id: documentId },
      data: updateData
    })

    return NextResponse.json(
      {
        message: 'Document modifié avec succès',
        document: updatedDocument
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur modification document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employees/:id/documents/:documentId
 * Supprimer un document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
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

    const { id, documentId } = await params

    // Vérifier que l'employé existe et appartient à l'établissement
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

    // Vérifier que le document existe et appartient à l'employé
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId: id
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document introuvable' },
        { status: 404 }
      )
    }

    // Supprimer le fichier de Supabase
    await deleteFileFromSupabase(document.fileUrl)

    // Supprimer le document de la base de données
    await prisma.employeeDocument.delete({
      where: { id: documentId }
    })

    return NextResponse.json(
      { message: 'Document supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    )
  }
}
