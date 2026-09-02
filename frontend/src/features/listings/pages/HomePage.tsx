import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Building2,
  TrendingUp,
  Shield,
  Star,
  ArrowRight,
  Sparkles,
  Key,
  Home as HomeIcon,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { listingsService, agenciesService } from '@/services/listings.service';
import { ListingCard } from '../components/ListingCard';

const POPULAR_CITIES = [
  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80', count: '450+ biens' },
  { name: 'Lyon', image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?auto=format&fit=crop&w=600&q=80', count: '280+ biens' },
  { name: 'Marseille', image: 'https://images.unsplash.com/photo-1589779257600-6078716301a9?auto=format&fit=crop&w=600&q=80', count: '210+ biens' },
  { name: 'Bordeaux', image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80', count: '170+ biens' },
];

const PROPERTY_TYPES_CARDS = [
  { type: 'appartement', title: 'Appartements', icon: '🏢', desc: 'Du studio au penthouse', color: 'from-blue-500/10 to-indigo-500/10' },
  { type: 'maison', title: 'Maisons & Villas', icon: '🏡', desc: 'Espaces familiaux et jardins', color: 'from-emerald-500/10 to-teal-500/10' },
  { type: 'studio', title: 'Studios & T1', icon: '🛋️', desc: 'Idéal étudiants & investisseurs', color: 'from-purple-500/10 to-pink-500/10' },
  { type: 'bureau', title: 'Bureaux & Pro', icon: '💼', desc: 'Locaux pour votre activité', color: 'from-amber-500/10 to-orange-500/10' },
];

export default function HomePage() {
  const [queryCity, setQueryCity] = useState('');
  const [transactionType, setTransactionType] = useState<'RENT' | 'SALE'>('SALE');
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  // Queries
  const { data: recentListings, isLoading: loadingRecent } = useQuery({
    queryKey: ['listings', 'recent'],
    queryFn: () => listingsService.getRecent(6),
  });

  const { data: popularListings, isLoading: loadingPopular } = useQuery({
    queryKey: ['listings', 'popular'],
    queryFn: () => listingsService.getPopular(6),
  });

  const { data: agenciesData, isLoading: loadingAgencies } = useQuery({
    queryKey: ['agencies', 'home'],
    queryFn: () => agenciesService.getAll({ limit: 4 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('transactionType', transactionType);
    if (queryCity.trim()) params.set('city', queryCity.trim());
    if (selectedType) params.set('propertyType', selectedType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="flex flex-col">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-24 text-white sm:py-32">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Plateforme immobilière intelligente & certifiée</span>
          </div>

          <h1 className="mb-6 text-4xl font-black tracking-tight sm:text-6xl sm:leading-tight">
            Trouvez le bien idéal pour{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              votre prochain chapitre
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base text-slate-300 sm:text-lg">
            Découvrez des milliers d'annonces vérifiées à l'achat et à la location. Estimation, géolocalisation et mise en relation directe avec les meilleures agences.
          </p>

          {/* Search Card Container */}
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/15 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
            {/* Tabs Achat / Location */}
            <div className="mb-4 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('SALE')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  transactionType === 'SALE'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <HomeIcon className="h-4 w-4" />
                Acheter
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('RENT')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  transactionType === 'RENT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Key className="h-4 w-4" />
                Louer
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto]">
              {/* Ville */}
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/15 focus-within:ring-indigo-400">
                <MapPin className="h-5 w-5 shrink-0 text-indigo-400" />
                <Input
                  id="hero-city-input"
                  value={queryCity}
                  onChange={(e) => setQueryCity(e.target.value)}
                  placeholder="Ville, code postal ou quartier..."
                  className="border-0 bg-transparent p-0 text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              {/* Type de bien */}
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/15">
                <Building className="h-5 w-5 shrink-0 text-indigo-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none [&>option]:text-slate-900"
                >
                  <option value="">Tous types de biens</option>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison / Villa</option>
                  <option value="studio">Studio</option>
                  <option value="bureau">Bureau</option>
                  <option value="terrain">Terrain</option>
                </select>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="h-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-600 hover:to-purple-700"
              >
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-b border-border bg-card py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: 'Annonces actives', value: '3 500+', icon: Building2 },
              { label: 'Agences certifiées', value: '120+', icon: Star },
              { label: 'Transactions validées', value: '9 800+', icon: TrendingUp },
              { label: 'Satisfaction client', value: '99.4%', icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <stat.icon className="mb-2 h-7 w-7 text-indigo-600" />
                <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Biens Récents ─── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Nouveautés</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Dernières annonces publiées</h2>
              <p className="text-sm text-muted-foreground mt-1">Soyez le premier à découvrir les biens mis en ligne aujourd'hui.</p>
            </div>
            <Link
              to="/properties?sortBy=date&sortOrder=desc"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Voir toutes les nouveautés <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingRecent ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : !recentListings || recentListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Aucune annonce récente pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Types de Biens ─── */}
      <section className="py-16 bg-muted/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Parcourir par catégorie</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">Quel type de bien cherchez-vous ?</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROPERTY_TYPES_CARDS.map((cat) => (
              <Link
                key={cat.type}
                to={`/properties?propertyType=${cat.type}`}
                className="group relative overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-border/80 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-indigo-500/40"
              >
                <div className="text-4xl mb-4">{cat.icon}</div>
                <h3 className="font-bold text-lg text-foreground group-hover:text-indigo-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
                <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 gap-1">
                  Explorer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Biens Populaires / Vedettes ─── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Coups de cœur</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Biens les plus consultés</h2>
              <p className="text-sm text-muted-foreground mt-1">Sélection des annonces les plus plébiscitées par notre communauté.</p>
            </div>
            <Link
              to="/properties?sortBy=relevance"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-500"
            >
              Voir les tendances <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingPopular ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : !popularListings || popularListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Aucun bien populaire disponible actuellement.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Zones Populaires ─── */}
      <section className="py-16 bg-muted/30 border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Localisation</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">Villes et régions les plus recherchées</h2>
            <p className="text-sm text-muted-foreground mt-1">Explorez les opportunités immobilières dans les grandes métropoles.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.name}
                to={`/properties?city=${city.name}`}
                className="group relative h-64 overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold">{city.name}</h3>
                  <p className="text-xs text-slate-200">{city.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Agences Partenaires ─── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Réseau certifié</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Nos agences partenaires</h2>
              <p className="text-sm text-muted-foreground mt-1">Des professionnels rigoureusement audités pour sécuriser votre projet.</p>
            </div>
            <Link
              to="/agencies"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Toutes les agences <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingAgencies ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : !agenciesData?.data || agenciesData.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Plus de 80 agences partenaires connectées.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {agenciesData.data.map((agency) => (
                <div
                  key={agency.id}
                  className="flex flex-col justify-between rounded-2xl bg-card p-6 ring-1 ring-border/80 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-lg mb-4">
                      {agency.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-foreground line-clamp-1">{agency.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agency.address}</p>
                  </div>
                  <div className="mt-4 border-t border-border/50 pt-3 text-xs text-indigo-600 font-medium">
                    {agency.phone || 'Agence vérifiée'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Vous vendez ou louez un bien immobilier ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300 text-sm sm:text-base">
            Bénéficiez de la visibilité d'Immo-MyKajy pour toucher des milliers d'acheteurs et de locataires qualifiés chaque jour.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-white px-7 py-3 font-semibold text-slate-950 shadow-xl hover:bg-slate-100 transition-colors text-sm"
            >
              Déposer une annonce gratuitement
            </Link>
            <Link
              to="/agencies"
              className="rounded-full border border-white/30 bg-white/10 px-7 py-3 font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors text-sm"
            >
              Contacter une agence
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
