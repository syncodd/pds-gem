import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const componentId = formData.get('componentId') as string;
    const modelType = formData.get('modelType') as string; // '2d' or '3d'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type based on model type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (modelType === '2d') {
      const allowed2D = ['svg', 'png', 'jpg', 'jpeg'];
      if (!fileExtension || !allowed2D.includes(fileExtension)) {
        return NextResponse.json(
          { error: 'Only SVG, PNG, JPG, JPEG files are allowed for 2D models' },
          { status: 400 }
        );
      }
    } else if (modelType === '3d') {
      const allowed3D = ['gltf', 'glb', 'obj', 'stl', 'fbx', 'babylon'];
      if (!fileExtension || !allowed3D.includes(fileExtension)) {
        return NextResponse.json(
          { error: 'Only GLTF, GLB, OBJ, STL, FBX, BABYLON files are allowed for 3D models' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Invalid model type' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedComponentId = componentId || 'component';
    const filename = `component-${sanitizedComponentId}-${modelType}-${timestamp}.${fileExtension}`;
    
    // Ensure components directory exists
    const componentsDir = join(process.cwd(), 'public', 'components');
    if (!existsSync(componentsDir)) {
      await mkdir(componentsDir, { recursive: true });
    }

    // Save file
    const filePath = join(componentsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Return the public path (accessible via /components/filename)
    const publicPath = `/components/${filename}`;

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
