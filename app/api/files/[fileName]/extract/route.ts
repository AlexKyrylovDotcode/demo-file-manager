import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromS3File } from '@/lib/textract';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    const decodedFileName = decodeURIComponent(fileName);
    
    // Check if file is PDF
    if (!decodedFileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Text extraction is only supported for PDF files' },
        { status: 400 }
      );
    }

    const extractedText = await extractTextFromS3File(decodedFileName);
    
    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from file' },
      { status: 500 }
    );
  }
}

