import { BarChart3, TrendingUp } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          Rapports d'Activité & Statistiques Globales
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Analyses de conversion, volume de transactions et croissance.
        </p>
      </div>

      <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
        <TrendingUp className="h-10 w-10 text-purple-600 mx-auto" />
        <h3 className="font-bold text-sm text-foreground">Rapports consolidés en temps réel</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Les statistiques de visite, taux de conversion des annonces et encaissements mensuels sont agrégés quotidiennement.
        </p>
      </div>
    </div>
  );
}
