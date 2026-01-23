import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase-server";
import { AddCompetitorDialog } from "@/components/competitors/AddCompetitorDialog";
import { CompetitorsList } from "@/components/competitors/CompetitorsList";

// Force dynamic since we read cookies/DB
export const dynamic = 'force-dynamic'

export default async function CompetitorsPage() {
    const supabase = await createClient();
    const { data: competitors } = await supabase
        .from('competitors')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-[1400px] mx-auto pt-10 pb-24 px-8">

            <PageHeader
                title="Análisis de Competencia"
                breadcrumb={[
                    { label: 'Zona Investigar', href: '#' },
                    { label: 'Competencia' }
                ]}
                action={<AddCompetitorDialog />}
            />

            <CompetitorsList initialCompetitors={competitors || []} />
        </div>
    );
}
