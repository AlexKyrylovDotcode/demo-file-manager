import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    const decodedFileName = decodeURIComponent(fileName);
    // Generate presigned URL with 1 hour expiration
    const url = await getPresignedUrl(decodedFileName, 3600);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Get presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate URL' },
      { status: 500 }
    );
  }
}

