import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Delete the document (cascading delete will handle chunks)
    const result = await sql`
      DELETE FROM documents 
      WHERE id = ${id} 
      RETURNING id, file_name
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      deleted: {
        id: result[0].id,
        file_name: result[0].file_name
      }
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}