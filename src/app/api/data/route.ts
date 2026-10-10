import { NextResponse } from 'next/server';
import { getAppData, saveAppData } from '@/lib/storage';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const data = getAppData();
    return NextResponse.json({ success: true, data }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar dados da aplicação.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const currentData = getAppData();
    
    // Merge new updates
    const updatedData = {
      ...currentData,
      profile: body.profile ? { ...currentData.profile, ...body.profile } : currentData.profile,
      links: body.links || currentData.links,
      slots: body.slots || currentData.slots,
      bookings: body.bookings || currentData.bookings,
    };

    saveAppData(updatedData);
    return NextResponse.json({ success: true, data: updatedData }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar dados.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
