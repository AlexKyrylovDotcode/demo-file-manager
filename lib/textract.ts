// Use dynamic imports to avoid Turbopack symlink issues with AWS SDK
async function getTextractClient() {
  const { TextractClient } = await import('@aws-sdk/client-textract');
  return new TextractClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

export async function extractTextFromS3File(fileName: string): Promise<string> {
  const { DetectDocumentTextCommand } = await import('@aws-sdk/client-textract');
  const textractClient = await getTextractClient();

  const command = new DetectDocumentTextCommand({
    Document: {
      S3Object: {
        Bucket: BUCKET_NAME,
        Name: fileName,
      },
    },
  });

  const response = await textractClient.send(command);
  
  if (!response.Blocks) {
    return '';
  }

  // Extract text from blocks
  const textBlocks = response.Blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
    .filter((text): text is string => text !== undefined);

  return textBlocks.join('\n');
}

