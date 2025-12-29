// Use dynamic imports to avoid Turbopack symlink issues with AWS SDK
async function getS3Client() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

async function fileExists(fileName: string): Promise<boolean> {
  const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
  const s3Client = await getS3Client();
  
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

function generateUniqueFileName(originalFileName: string, counter: number = 0): string {
  const lastDotIndex = originalFileName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    // No extension
    return counter === 0 ? originalFileName : `${originalFileName}_${counter}`;
  }
  
  const nameWithoutExt = originalFileName.substring(0, lastDotIndex);
  const extension = originalFileName.substring(lastDotIndex);
  
  return counter === 0 
    ? originalFileName 
    : `${nameWithoutExt}_${counter}${extension}`;
}

export async function getUniqueFileName(fileName: string): Promise<string> {
  let uniqueFileName = fileName;
  let counter = 0;
  
  while (await fileExists(uniqueFileName)) {
    counter++;
    uniqueFileName = generateUniqueFileName(fileName, counter);
  }
  
  return uniqueFileName;
}

export async function uploadFile(file: File, fileName: string): Promise<void> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const s3Client = await getS3Client();
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
    // ACL removed - use bucket policy for public access if needed
  });

  await s3Client.send(command);
}

export function getPublicUrl(fileName: string): string {
  const region = process.env.AWS_REGION || 'us-east-1';
  // Handle different S3 URL formats based on region
  if (region === 'us-east-1') {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(fileName)}`;
  } else {
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${encodeURIComponent(fileName)}`;
  }
}

export async function getPresignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const s3Client = await getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

export async function listFiles(): Promise<Array<{ key: string }>> {
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const s3Client = await getS3Client();
  
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
  });

  const response = await s3Client.send(command);
  const files: Array<{ key: string }> = [];

  if (response.Contents) {
    for (const object of response.Contents) {
      if (object.Key) {
        files.push({
          key: object.Key,
        });
      }
    }
  }

  return files;
}

export async function deleteFile(fileName: string): Promise<void> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const s3Client = await getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  await s3Client.send(command);
}

