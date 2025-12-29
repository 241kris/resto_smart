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
 * GET /api/employees/:id/documents
 * Récupérer tous les documents d'un employé
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

    // Récupérer les documents
    const documents = await prisma.employeeDocument.findMany({
      where: {
        employeeId: id
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json(
      { documents },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération documents:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees/:id/documents
 * Créer un nouveau document pour un employé
 */
export async function POST(
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

    const body = await request.json()
    const { documentType, fileName, file } = body

    // Validation
    if (!documentType || documentType.trim() === '') {
      return NextResponse.json(
        { error: 'Le type de document est requis' },
        { status: 400 }
      )
    }

    if (!fileName || fileName.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du fichier est requis' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Le fichier est requis' },
        { status: 400 }
      )
    }

    // Validation du fichier
    const isBase64 = file.startsWith('data:')
    const isUrl = file.startsWith('http://') || file.startsWith('https://')

    if (!isBase64 && !isUrl) {
      return NextResponse.json(
        { error: 'Format de fichier invalide' },
        { status: 400 }
      )
    }

    // Traitement du fichier
    let fileUrl = null

    if (isUrl) {
      fileUrl = file
    } else if (isBase64) {
      // Vérifier la taille (max 5MB pour les documents)
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
          fileToUpload = await compressImage(file, 60) // 60% de qualité pour les documents
        } catch (error) {
          console.error('Erreur compression:', error)
        }
      }

      // Upload sur Supabase
      try {
        const extension = mimeType.split('/')[1] || 'pdf'
        const uniqueFileName = `document-${nanoid(16)}.${extension}`
        fileUrl = await uploadImageToSupabase(fileToUpload, 'employee_documents', uniqueFileName)
      } catch (uploadError) {
        console.error('Erreur upload fichier:', uploadError)
        return NextResponse.json(
          { error: 'Erreur lors de l\'upload du fichier' },
          { status: 500 }
        )
      }
    }

    // Créer le document
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: id,
        documentType: documentType.trim(),
        fileName: fileName.trim(),
        fileUrl: fileUrl!
      }
    })

    return NextResponse.json(
      {
        message: 'Document créé avec succès',
        document
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du document' },
      { status: 500 }
    )
  }
}
