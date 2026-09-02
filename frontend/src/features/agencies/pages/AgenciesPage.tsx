import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agenciesService } from '@/services/listings.service';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AgenciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['agencies-list', { q: searchQuery, page }],
    queryFn: () => agenciesService.getAll({ q: searchQuery || undefined, page, limit: 12 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* ── Header ── */}
      <div className="mx-auto max-w-3xl text-center mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Réseau Partenaire Certifié</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Nos Agences Immobilières
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Faites confiance aux agences et mandataires audités par Immo-MyKajy pour estimer, vendre, louer ou gérer votre patrimoine.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom d'agence, ville..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
            Rechercher
          </Button>
        </form>
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-bold text-foreground">Aucune agence trouvée</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez de modifier vos termes de recherche.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((agency) => (
            <div
              key={agency.id}
              className="group flex flex-col justify-between rounded-2xl bg-card p-6 ring-1 ring-border/80 transition-all duration-300 hover:shadow-lg hover:ring-indigo-500/30"
            >
              <div>
                {/* Header with Avatar/Logo */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 font-bold text-xl text-indigo-600 ring-1 ring-indigo-500/20">
                    {agency.logoUrl ? (
                      <img src={agency.logoUrl} alt={agency.name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      agency.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    Certifiée
                  </Badge>
                </div>

                {/* Agency Name & Description */}
                <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                  {agency.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {agency.description || 'Agence immobilière partenaire spécialisée dans la vente, location et estimation.'}
                </p>

                {/* Contact details */}
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <span className="truncate">{agency.address}</span>
                  </div>
                  {agency.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span className="truncate">{agency.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions & Website */}
              <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between">
                {agency.website ? (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    <Globe className="h-3.5 w-3.5" /> Site web <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Réseau Immo-MyKajy</span>
                )}
                <Button size="sm" variant="outline" className="rounded-xl text-xs">
                  Contacter
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
