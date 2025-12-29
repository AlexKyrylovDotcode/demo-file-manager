import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getUniqueFileName } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalFileName = file.name;
    const uniqueFileName = await getUniqueFileName(originalFileName);
    await uploadFile(file, uniqueFileName);

    return NextResponse.json({ fileName: uniqueFileName });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

