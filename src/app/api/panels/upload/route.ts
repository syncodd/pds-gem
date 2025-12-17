import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const panelId = formData.get('panelId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.svg')) {
      return NextResponse.json({ error: 'Only SVG files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedPanelId = panelId || 'panel';
    const filename = `panel-${sanitizedPanelId}-${timestamp}.svg`;
    
    // Ensure panels directory exists
    const panelsDir = join(process.cwd(), 'public', 'panels');
    if (!existsSync(panelsDir)) {
      await mkdir(panelsDir, { recursive: true });
    }

    // Save file
    const filePath = join(panelsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Return the public path (accessible via /panels/filename.svg)
    const publicPath = `/panels/${filename}`;

    return NextResponse.json({ 
      success: true,
      path: publicPath,
      filename: filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

