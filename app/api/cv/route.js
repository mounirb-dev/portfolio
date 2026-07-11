import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'cv', 'Mounir_Bella_CV.pdf')
  const file = await readFile(filePath)

  return new Response(file, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Mounir_Bella_CV.pdf"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
