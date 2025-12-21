import { NextRequest, NextResponse } from 'next/server';
import { preprocessStreamingHistory, RawStreamingRecord } from '@/lib/preprocessing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const records: RawStreamingRecord[] = body.records || [];
    
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data: records must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Preprocess the records
    const processed = preprocessStreamingHistory(records);
    
    return NextResponse.json({ processed });
  } catch (error) {
    console.error('Preprocessing error:', error);
    return NextResponse.json(
      { error: 'Failed to preprocess data' },
      { status: 500 }
    );
  }
}

