import { NextResponse } from 'next/server';
import { createBooking, createManualBooking, getAppData, saveAppData, updateBookingStatus } from '@/lib/storage';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const data = getAppData();
    return NextResponse.json(
      { success: true, slots: data.slots, bookings: data.bookings },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar horários.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ação 1: Paciente tentando pré-agendar um horário
    if (body.action === 'book') {
      const { slotId, patientName, patientPhone, procedure, notes } = body;

      if (!slotId || !patientName || !patientPhone || !procedure) {
        return NextResponse.json(
          { success: false, message: 'Preencha todos os campos obrigatórios.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const appData = getAppData();
      const targetSlot = appData.slots.find((s) => s.id === slotId);

      if (!targetSlot) {
        return NextResponse.json(
          { success: false, message: 'Horário não encontrado.' },
          { status: 404, headers: corsHeaders }
        );
      }

      if (targetSlot.status !== 'available') {
        return NextResponse.json(
          { success: false, message: 'Este horário não está mais disponível.' },
          { status: 409, headers: corsHeaders }
        );
      }

      const result = createBooking({
        slotId,
        date: targetSlot.date,
        time: targetSlot.time,
        patientName,
        patientPhone,
        procedure,
        notes,
      });

      if (!result) {
        return NextResponse.json(
          { success: false, message: 'Não foi possível concluir o pré-agendamento.' },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Horário reservado com sucesso! Confirme via WhatsApp.',
          booking: result.booking,
          slot: result.slot,
        },
        { headers: corsHeaders }
      );
    }

    // Ação 2: Admin criando horários em lote por data
    if (body.action === 'add-slots') {
      const { date, times } = body;

      if (!date || !Array.isArray(times) || times.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Data e lista de horários são obrigatórios.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const appData = getAppData();
      const newSlots = [...appData.slots];

      times.forEach((t: string) => {
        const exists = newSlots.some((s) => s.date === date && s.time === t);
        if (!exists) {
          newSlots.push({
            id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date,
            time: t,
            status: 'available',
          });
        }
      });

      newSlots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

      appData.slots = newSlots;
      saveAppData(appData);

      return NextResponse.json({ success: true, slots: appData.slots }, { headers: corsHeaders });
    }

    // Ação 3: Admin alterando status do horário
    if (body.action === 'update-status') {
      const { slotId, status } = body;
      const appData = getAppData();
      const slotIndex = appData.slots.findIndex((s) => s.id === slotId);

      if (slotIndex !== -1) {
        appData.slots[slotIndex].status = status;
        saveAppData(appData);
        return NextResponse.json({ success: true, slot: appData.slots[slotIndex] }, { headers: corsHeaders });
      }

      return NextResponse.json(
        { success: false, message: 'Horário não encontrado.' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Ação 4: Admin confirmando ou cancelando pré-agendamento
    if (body.action === 'update-booking-status') {
      const { bookingId, status } = body;
      const success = updateBookingStatus(bookingId, status);
      if (success) {
        const appData = getAppData();
        return NextResponse.json(
          { success: true, slots: appData.slots, bookings: appData.bookings },
          { headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Agendamento não encontrado.' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Ação 5: Admin criando agendamento manual
    if (body.action === 'manual-booking') {
      const { slotId, date, time, patientName, patientPhone, procedure, notes, status } = body;

      if (!date || !time || !patientName || !patientPhone) {
        return NextResponse.json(
          { success: false, message: 'Data, horário, nome e telefone são obrigatórios.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const result = createManualBooking({
        slotId,
        date,
        time,
        patientName,
        patientPhone,
        procedure: procedure || 'Consulta Presencial',
        notes,
        status: status || 'confirmed',
      });

      const appData = getAppData();
      return NextResponse.json(
        {
          success: true,
          message: 'Agendamento manual registrado com sucesso!',
          booking: result.booking,
          slot: result.slot,
          slots: appData.slots,
          bookings: appData.bookings,
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Ação não reconhecida.' },
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao processar requisição de horários.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get('slotId');

    if (!slotId) {
      return NextResponse.json(
        { success: false, message: 'slotId é obrigatório.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const appData = getAppData();
    appData.slots = appData.slots.filter((s) => s.id !== slotId);
    saveAppData(appData);

    return NextResponse.json({ success: true, slots: appData.slots }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar horário.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
