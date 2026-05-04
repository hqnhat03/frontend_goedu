import { redirect } from 'next/navigation';

export default async function ClassDetailPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    redirect(`/classes/${code}/bulletin`);
}