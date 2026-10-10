import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dra. Thaysa Meschiatti | Cirurgiã-Dentista • CRO ES 11914',
  description: 'Agende seu atendimento odontológico com a Dra. Thaysa Meschiatti. Cirurgiã-Dentista especializada em odontologia estética e cuidado integrado. Acesse horários e links úteis.',
  keywords: ['Dentista', 'Dra. Thaysa Meschiatti', 'Odontologia', 'Agendamento Dentista', 'CRO ES 11914', 'Estética Dental'],
  authors: [{ name: 'Dra. Thaysa Meschiatti' }],
  openGraph: {
    title: 'Dra. Thaysa Meschiatti | Cirurgiã-Dentista',
    description: 'Agendamentos prévios e links oficiais da Dra. Thaysa Meschiatti (CRO ES 11914).',
    images: ['/logo-2.jpeg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/logo-1.jpeg" />
      </head>
      <body className="antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
