import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsService } from '@/services/listings.service';
import { inquiriesService } from '@/services/inquiries.service';
import { VisitBookingModal } from '@/features/visits/components/VisitBookingModal';
import { RentalApplicationModal } from '@/features/rentals/components/RentalApplicationModal';
import { StartConversationModal } from '@/features/messages/components/StartConversationModal';
import { PropertyCard } from '../components/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Car,
  Trees,
  Waves,
  Sparkles,
  Send,
  Building2,
  Layers,
  Home,
  Maximize,
  ExternalLink,
  FileText,
  MessageSquare,
} from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Interactive States
  const [isFavorite, setIsFavorite] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Query Detail
  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['property-detail', id],
    queryFn: () => listingsService.getById(id!),
    enabled: !!id,
  });

  // Query Similar Properties (based on same transaction type or city)
  const { data: similarData, isLoading: loadingSimilar } = useQuery({
    queryKey: ['similar-properties', listing?.transactionType, listing?.location?.city],
    queryFn: () =>
      listingsService.search({
        transactionType: listing?.transactionType,
        city: listing?.location?.city,
        limit: 3,
      }),
    enabled: !!listing,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="h-6 w-36 mb-6" />
        <Skeleton className="h-[460px] w-full rounded-3xl mb-8" />
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4 text-3xl">
          🏚️
        </div>
        <h2 className="text-2xl font-black text-foreground">Bien immobilier introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette annonce n'existe plus ou a été retirée du catalogue.
        </p>
        <Link to="/properties" className="mt-6 inline-block">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Parcourir les biens disponibles
          </Button>
        </Link>
      </div>
    );
  }

  const { property, location, price, primaryPhoto } = listing;

  // Gallery array
  const photos = primaryPhoto?.url
    ? [
        primaryPhoto.url,
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
      ]
    : [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      ];

  // Coordinates
  const lat = location.latitude || -18.8792;
  const lng = location.longitude || 47.5079;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.015}%2C${lng + 0.02}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`;

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing?.id) return;

    try {
      setSendingInquiry(true);
      await inquiriesService.create({
        listingId: listing.id,
        subject: `Demande d'information pour : ${listing.title || property.title}`,
        message:
          contactMessage.trim() ||
          `Bonjour, je souhaite obtenir plus d'informations concernant l'annonce Réf #${listing.id.substring(0, 8).toUpperCase()}.`,
        name: contactName.trim() || undefined,
        email: contactEmail.trim() || undefined,
        phone: contactPhone.trim() || undefined,
      });
      setContactSent(true);
    } catch (err) {
      console.error("Erreur d'envoi du message :", err);
      alert("Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.");
    } finally {
      setSendingInquiry(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Top Bar: Breadcrumb + Action buttons (Favoris, Partage) ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux résultats
        </Link>

        <div className="flex items-center gap-2">
          {/* Section 12 : Ajouter aux favoris */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`rounded-xl gap-2 font-semibold text-xs transition-all ${
              isFavorite
                ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-950/40 dark:border-red-800'
                : ''
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
            {isFavorite ? 'Enregistré dans vos favoris' : 'Ajouter aux favoris'}
          </Button>

          {/* Share */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: listing.title || property.title,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Lien de l’annonce copié dans le presse-papier !');
              }
            }}
            className="rounded-xl gap-1.5 text-xs font-semibold"
          >
            <Share2 className="h-4 w-4" /> Partager
          </Button>
        </div>
      </div>

      {/* ── Section 1 : Galerie Photos ── */}
      <div className="mb-10 space-y-3">
        {/* Main Photo */}
        <div className="relative h-[340px] sm:h-[480px] lg:h-[540px] w-full overflow-hidden rounded-3xl bg-muted ring-1 ring-border shadow-md">
          <img
            src={photos[activePhotoIndex]}
            alt={listing.title || property.title}
            className="h-full w-full object-cover transition-all duration-300"
          />

          {/* Badges Overlay (Section 3 : Type de transaction) */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge
              className={`rounded-full px-3.5 py-1 text-xs font-black tracking-wide text-white shadow-md ${
                listing.transactionType === 'RENT' ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
            >
              {listing.transactionType === 'RENT' ? 'À LOUER' : 'À VENDRE'}
            </Badge>
            {listing.isFeatured && (
              <Badge className="rounded-full bg-amber-500 text-white text-xs font-semibold shadow-md">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Coup de cœur
              </Badge>
            )}
            <Badge variant="outline" className="bg-background/80 backdrop-blur-md rounded-full text-xs font-semibold">
              {property.typeName || 'Bien immobilier'}
            </Badge>
          </div>

          {/* Photo Counter */}
          <div className="absolute right-4 bottom-4 rounded-xl bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            📷 {activePhotoIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Thumbnail Carousel / Grid */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {photos.map((photo, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActivePhotoIndex(index)}
              className={`relative h-20 w-28 sm:h-24 sm:w-36 shrink-0 overflow-hidden rounded-2xl ring-2 transition-all ${
                activePhotoIndex === index
                  ? 'ring-indigo-600 scale-100 shadow-md'
                  : 'ring-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* ── Left Column: Specs, Description, Équipements, Carte, Agence ── */}
        <div className="space-y-10">
          {/* Section 4 & 5 : Titre, Localisation & En-tête */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
              <span>{property.typeName || 'Immobilier'}</span>
              <span>•</span>
              <span>Réf #{listing.id.substring(0, 8).toUpperCase()}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
              {listing.title || property.title}
            </h1>

            {/* Section 4 : Localisation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>
                {location.formatted ||
                  `${location.neighborhood ? location.neighborhood + ', ' : ''}${location.city} (${location.zipCode}), ${location.country}`}
              </span>
            </div>
          </div>

          {/* Section 6 : Caractéristiques Clés (Cards) */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-4">Caractéristiques principales</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-card p-4 text-center ring-1 ring-border/80 shadow-xs">
                <Ruler className="mx-auto mb-1.5 h-6 w-6 text-indigo-600" />
                <div className="text-xl font-black text-foreground">{property.area} m²</div>
                <div className="text-xs text-muted-foreground">Surface habitable</div>
              </div>

              {property.bedrooms !== undefined && (
                <div className="rounded-2xl bg-card p-4 text-center ring-1 ring-border/80 shadow-xs">
                  <BedDouble className="mx-auto mb-1.5 h-6 w-6 text-indigo-600" />
                  <div className="text-xl font-black text-foreground">{property.bedrooms}</div>
                  <div className="text-xs text-muted-foreground">Chambre{property.bedrooms > 1 ? 's' : ''}</div>
                </div>
              )}

              {property.bathrooms !== undefined && (
                <div className="rounded-2xl bg-card p-4 text-center ring-1 ring-border/80 shadow-xs">
                  <Bath className="mx-auto mb-1.5 h-6 w-6 text-indigo-600" />
                  <div className="text-xl font-black text-foreground">{property.bathrooms}</div>
                  <div className="text-xs text-muted-foreground">Salle{property.bathrooms > 1 ? 's' : ''} de bain</div>
                </div>
              )}

              {property.parkingSpaces !== undefined && (
                <div className="rounded-2xl bg-card p-4 text-center ring-1 ring-border/80 shadow-xs">
                  <Car className="mx-auto mb-1.5 h-6 w-6 text-indigo-600" />
                  <div className="text-xl font-black text-foreground">{property.parkingSpaces}</div>
                  <div className="text-xs text-muted-foreground">Parking / Garage</div>
                </div>
              )}
            </div>

            {/* Additional details table */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
              {property.landArea && (
                <div>
                  <span className="font-semibold text-foreground">Surface terrain :</span> {property.landArea} m²
                </div>
              )}
              {property.rooms && (
                <div>
                  <span className="font-semibold text-foreground">Nombre de pièces :</span> {property.rooms}
                </div>
              )}
              {property.energyRating && (
                <div>
                  <span className="font-semibold text-foreground">Classe DPE :</span> {property.energyRating}
                </div>
              )}
            </div>
          </div>

          {/* Section 5 : Description détaillée */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
            <h2 className="text-lg font-bold text-foreground mb-4">Description du bien</h2>
            <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {listing.descriptionExcerpt ||
                `Magnifique opportunité immobilière ! Ce bien d'exception offre de superbes volumes, une luminosité remarquable et des prestations haut de gamme.

Proche de toutes commodités, des écoles, des commerces et des transports en commun. Idéal pour une résidence principale confortable ou un investissement locatif pérenne. Contactez dès à présent notre équipe pour organiser une visite.`}
            </div>
          </div>

          {/* Section 7 : Équipements & Prestations */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
            <h2 className="text-lg font-bold text-foreground mb-4">Équipements & Commodités</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[
                { label: 'Meublé', active: property.isFurnished, icon: Home },
                { label: 'Piscine privée', active: property.hasPool, icon: Waves },
                { label: 'Jardin aménagé', active: property.hasGarden, icon: Trees },
                { label: 'Balcon / Terrasse', active: property.hasBalcony, icon: Maximize },
                { label: 'Ascenseur', active: property.hasElevator, icon: Layers },
                { label: 'Garage fermé', active: property.hasGarage, icon: Car },
              ]
                .filter((item) => item.active !== false)
                .map((eq) => (
                  <div
                    key={eq.label}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium ${
                      eq.active
                        ? 'border-emerald-500/30 bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'border-border/60 text-muted-foreground'
                    }`}
                  >
                    <CheckCircle className={`h-4 w-4 ${eq.active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span>{eq.label}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 8 : Carte & Localisation Interactive */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Localisation & Quartier</h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                {location.city} ({location.country})
              </span>
            </div>
            <div className="h-72 w-full overflow-hidden rounded-2xl border border-border/80">
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={osmEmbedUrl}
                className="h-full w-full"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              📍 Emplacement approximatif communiqué pour préserver la tranquillité des résidents. L'adresse exacte vous sera transmise lors de la confirmation du rendez-vous.
            </p>
          </div>

          {/* Section 9 : Informations Agence / Propriétaire */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
            <h2 className="text-lg font-bold text-foreground mb-4">Annonceur & Agence Partenaire</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-xl shadow-md">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-base">Agence Immobilière MyKajy</h3>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                      Certifiée
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Partenaire officiel Immo-MyKajy</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">📞 +261 20 22 000 00 / +33 1 40 00 00 00</p>
                </div>
              </div>

              <Link to="/agencies">
                <Button variant="outline" size="sm" className="rounded-xl text-xs">
                  Voir toutes les annonces de l'agence
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right Column: Prix, Détails Financiers, Demande de visite, Formulaire Contact ── */}
        <div className="space-y-6">
          {/* Section 2 : Boîte de Prix & Financière */}
          <div className="sticky top-20 rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xl">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {listing.transactionType === 'RENT' ? 'Loyer mensuel' : 'Prix de vente'}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-foreground">
                {price.formatted || `${price.price.toLocaleString('fr-FR')} €`}
              </div>
              {listing.transactionType === 'RENT' && (
                <div className="text-xs text-muted-foreground mt-0.5">Charges comprises</div>
              )}
              {price.pricePerSqmFormatted && (
                <div className="mt-1 text-xs text-indigo-600 font-semibold">
                  {price.pricePerSqmFormatted}
                </div>
              )}
            </div>

            {/* Détails financiers différenciés Vente vs Location */}
            <div className="border-t border-border/60 py-4 space-y-2 text-xs">
              {listing.transactionType === 'RENT' ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Loyer :</span>
                    <span className="font-semibold text-foreground">{price.price.toLocaleString('fr-FR')} € / mois</span>
                  </div>
                  {price.charges !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Provisions sur charges :</span>
                      <span className="font-semibold text-foreground">{price.charges} € / mois</span>
                    </div>
                  )}
                  {price.deposit !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Dépôt de garantie (caution) :</span>
                      <span className="font-semibold text-foreground">{price.deposit} €</span>
                    </div>
                  )}
                  {price.agencyFees !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Honoraires d'agence :</span>
                      <span className="font-semibold text-foreground">{price.agencyFees} €</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Prix net vendeur :</span>
                    <span className="font-semibold text-foreground">{price.price.toLocaleString('fr-FR')} €</span>
                  </div>
                  {price.agencyFees !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frais d'agence inclus :</span>
                      <span className="font-semibold text-foreground">{price.agencyFees} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Honoraires :</span>
                    <span className="font-semibold text-foreground">À la charge de l'acquéreur</span>
                  </div>
                </>
              )}
            </div>

            {/* Section 13 : Demander une visite & Déposer un dossier */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => setShowVisitModal(true)}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-6 font-bold text-white shadow-lg shadow-indigo-600/30 text-sm"
              >
                <Calendar className="mr-2 h-4 w-4" /> Demander une visite
              </Button>

              {listing.transactionType === 'RENT' && (
                <Button
                  variant="outline"
                  onClick={() => setShowApplyModal(true)}
                  className="w-full rounded-2xl border-indigo-600/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 py-6 font-bold text-sm"
                >
                  <FileText className="mr-2 h-4 w-4" /> Déposer mon dossier locataire
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowChatModal(true)}
                className="w-full rounded-2xl border-purple-600/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 py-6 font-bold text-sm"
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Discuter par messagerie directe
              </Button>

              {/* Section 11 : Formulaire de contact direct */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border/60">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3">
                  Contacter le conseiller
                </h3>

                {contactSent ? (
                  <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                    <p className="font-bold">Message transmis avec succès !</p>
                    <p className="mt-0.5 text-[11px]">Notre conseiller vous contactera dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactFormSubmit} className="space-y-2.5">
                    <Input
                      placeholder="Votre nom complet"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="text-xs rounded-xl bg-background"
                    />
                    <Input
                      type="email"
                      placeholder="Votre email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="text-xs rounded-xl bg-background"
                    />
                    <Input
                      type="tel"
                      placeholder="Votre téléphone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="text-xs rounded-xl bg-background"
                    />
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={`Bonjour, je souhaite obtenir plus d'informations concernant l'annonce Réf #${listing.id.substring(0, 8).toUpperCase()}.`}
                      className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      type="submit"
                      disabled={sendingInquiry}
                      variant="outline"
                      className="w-full rounded-xl text-xs font-bold border-indigo-600/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      {sendingInquiry ? 'Envoi en cours…' : 'Envoyer mon message'}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Garantie tranquillité & transaction sécurisée Immo-MyKajy</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 10 : Biens Similaires ── */}
      <div className="mt-20 border-t border-border/60 pt-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Recommandations</span>
            <h2 className="text-2xl font-black text-foreground">Biens similaires recommandés</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Découvrez d'autres annonces susceptibles de correspondre à votre recherche dans la même zone.
            </p>
          </div>
          <Link
            to={`/properties?transactionType=${listing.transactionType}&city=${location.city}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
          >
            Voir plus <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingSimilar ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : !similarData?.items || similarData.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun autre bien similaire trouvé pour le moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similarData.items
              .filter((item) => item.id !== listing.id)
              .slice(0, 3)
              .map((simListing) => (
                <PropertyCard key={simListing.id} listing={simListing} />
              ))}
          </div>
        )}
      </div>

      {/* ── Section 13 : Modal Demande de visite avec créneaux en direct ── */}
      <VisitBookingModal
        listingId={listing.id}
        listingTitle={listing.title || property.title}
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
      />

      {/* ── Modal Candidature Locataire & Pièces Justificatives ── */}
      <RentalApplicationModal
        listingId={listing.id}
        listingTitle={listing.title || property.title}
        monthlyRent={price.price}
        charges={price.charges || 0}
        deposit={price.deposit || 0}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
      />

      {/* ── Modal Messagerie Directe ── */}
      <StartConversationModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        recipientId={(listing as any)?.agent?.userId || (listing as any)?.property?.owner?.userId || 'agent-support'}
        recipientName={(listing as any)?.agent?.name || 'Le conseiller Immo-MyKajy'}
        recipientRole={(listing as any)?.agent ? 'Agent Immobilier' : 'Conseiller'}
        listingId={listing.id}
        listingTitle={listing.title || property.title}
      />
    </div>
  );
}
