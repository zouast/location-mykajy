import {
  PrismaClient,
  Role,
  Gender,
  TransactionType,
  PropertyStatus,
  ListingStatus,
  ListingVisibility,
  MediaType,
  VisitStatus,
  VisitType,
  InquiryStatus,
  SaleStatus,
  RentalStatus,
  ContractStatus,
  PaymentStatus,
  PaymentMethod,
  CommissionStatus,
  NotificationType,
  AuditAction,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ── 1. Clean all tables (order matters for FK constraints) ──
  console.log('🗑️  Cleaning tables...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rentalContract.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listingPrice.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.propertyFeature.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.property.deleteMany();
  await prisma.location.deleteMany();
  await prisma.propertyType.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.client.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.user.deleteMany();

  // ── 2. Hash passwords ──
  const hash = await bcrypt.hash('password123', 10);

  // ── 3. Create Users ──
  console.log('👤 Creating users...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mykajy.local',
      password: hash,
      firstName: 'Admin',
      lastName: 'Système',
      role: Role.ADMIN,
      gender: Gender.MALE,
      isVerified: true,
    },
  });

  const agencyAdminUser = await prisma.user.create({
    data: {
      email: 'agence@mykajy.local',
      password: hash,
      firstName: 'Sophie',
      lastName: 'Renard',
      phone: '+33 6 12 34 56 78',
      role: Role.AGENCY_ADMIN,
      gender: Gender.FEMALE,
      isVerified: true,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@mykajy.local',
      password: hash,
      firstName: 'Pierre',
      lastName: 'Dubois',
      phone: '+33 6 98 76 54 32',
      role: Role.AGENT,
      gender: Gender.MALE,
      isVerified: true,
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@mykajy.local',
      password: hash,
      firstName: 'Alice',
      lastName: 'Martin',
      phone: '+33 6 55 44 33 22',
      role: Role.OWNER,
      gender: Gender.FEMALE,
      isVerified: true,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@mykajy.local',
      password: hash,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33 6 11 22 33 44',
      role: Role.CLIENT,
      gender: Gender.MALE,
      isVerified: true,
    },
  });

  const clientUser2 = await prisma.user.create({
    data: {
      email: 'marie@mykajy.local',
      password: hash,
      firstName: 'Marie',
      lastName: 'Lambert',
      role: Role.CLIENT,
      gender: Gender.FEMALE,
      isVerified: true,
    },
  });

  // ── 4. Agency ──
  console.log('🏢 Creating agency...');

  const agency = await prisma.agency.create({
    data: {
      name: 'MyKajy Immobilier',
      legalName: 'MyKajy Immobilier SAS',
      siret: '12345678901234',
      address: '10 Rue de la Paix',
      city: 'Paris',
      zipCode: '75002',
      phone: '+33 1 42 68 53 00',
      email: 'contact@mykajy-immo.fr',
      website: 'https://immo.mykajy.fr',
      licenseNumber: 'CPI 7501 2026 000 123 456',
      isVerified: true,
    },
  });

  // ── 5. Profiles ──
  console.log('👥 Creating profiles...');

  const agentProfile = await prisma.agent.create({
    data: {
      userId: agentUser.id,
      agencyId: agency.id,
      title: 'Conseiller Immobilier Senior',
      licenseNumber: 'AGT-2026-001',
      biography: 'Expert immobilier sur Paris et sa petite couronne depuis plus de 8 ans. Spécialiste du marché résidentiel haut de gamme.',
      specialties: ['Résidentiel', 'Luxe', 'Investissement'],
      yearsExperience: 8,
      rating: 4.7,
      reviewCount: 42,
    },
  });

  const ownerProfile = await prisma.owner.create({
    data: {
      userId: ownerUser.id,
      companyName: 'Martin Patrimoine SCI',
      siret: '98765432109876',
      address: '5 Avenue Montaigne, 75008 Paris',
    },
  });

  const clientProfile = await prisma.client.create({
    data: {
      userId: clientUser.id,
      preferredCity: 'Paris',
      budgetMin: 1200,
      budgetMax: 2200,
      preferredType: TransactionType.RENT,
      preferredRooms: 3,
    },
  });

  await prisma.client.create({
    data: {
      userId: clientUser2.id,
      preferredCity: 'Nantes',
      budgetMin: 250000,
      budgetMax: 600000,
      preferredType: TransactionType.SALE,
    },
  });

  // ── 6. Property Types ──
  console.log('🏷️  Creating property types...');

  const [aptType, houseType, studioType, officeType, loftType] = await Promise.all([
    prisma.propertyType.create({ data: { name: 'Appartement', slug: 'appartement', icon: 'apartment' } }),
    prisma.propertyType.create({ data: { name: 'Maison', slug: 'maison', icon: 'house' } }),
    prisma.propertyType.create({ data: { name: 'Studio', slug: 'studio', icon: 'studio' } }),
    prisma.propertyType.create({ data: { name: 'Bureau', slug: 'bureau', icon: 'office' } }),
    prisma.propertyType.create({ data: { name: 'Loft', slug: 'loft', icon: 'loft' } }),
  ]);

  // ── 7. Locations ──
  console.log('📍 Creating locations...');

  const loc1 = await prisma.location.create({
    data: {
      address: '45 Rue de la Grange aux Belles',
      city: 'Paris',
      state: 'Île-de-France',
      zipCode: '75010',
      country: 'France',
      latitude: 48.8741,
      longitude: 2.3662,
      neighborhood: 'Canal Saint-Martin',
    },
  });

  const loc2 = await prisma.location.create({
    data: {
      address: '12 Avenue des Lilas',
      city: 'Nantes',
      state: 'Pays de la Loire',
      zipCode: '44000',
      country: 'France',
      latitude: 47.2184,
      longitude: -1.5536,
      neighborhood: 'Centre-ville',
    },
  });

  const loc3 = await prisma.location.create({
    data: {
      address: '8 Rue des Écoles',
      city: 'Lyon',
      state: 'Auvergne-Rhône-Alpes',
      zipCode: '69005',
      country: 'France',
      latitude: 45.7578,
      longitude: 4.8235,
      neighborhood: 'Vieux Lyon',
    },
  });

  // ── 8. Properties ──
  console.log('🏠 Creating properties...');

  const prop1 = await prisma.property.create({
    data: {
      title: 'Superbe T3 lumineux avec balcon proche Canal Saint-Martin',
      description: 'Dans une copropriété calme et sécurisée, bel appartement traversant comprenant un grand séjour lumineux, 2 chambres spacieuses, une cuisine entièrement aménagée et un grand balcon exposé sud offrant une vue dégagée.',
      status: PropertyStatus.AVAILABLE,
      yearBuilt: 2018,
      floor: 4,
      totalFloors: 6,
      bedrooms: 2,
      bathrooms: 1,
      rooms: 3,
      area: 68.5,
      parkingSpaces: 0,
      energyRating: 'C',
      ghgRating: 'B',
      hasBalcony: true,
      hasElevator: true,
      typeId: aptType.id,
      locationId: loc1.id,
      ownerId: ownerProfile.id,
      agencyId: agency.id,
      agentId: agentProfile.id,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      title: 'Maison contemporaine 5 pièces avec piscine',
      description: 'Magnifique villa contemporaine construite en 2021 aux prestations haut de gamme. Vaste pièce de vie de 60m², 4 chambres dont une suite parentale, jardin paysager de 800m² avec piscine chauffée.',
      status: PropertyStatus.AVAILABLE,
      yearBuilt: 2021,
      bedrooms: 4,
      bathrooms: 2,
      rooms: 5,
      area: 145.0,
      landArea: 800.0,
      parkingSpaces: 2,
      energyRating: 'A',
      ghgRating: 'A',
      hasGarden: true,
      hasPool: true,
      hasGarage: true,
      typeId: houseType.id,
      locationId: loc2.id,
      ownerId: ownerProfile.id,
      agencyId: agency.id,
      agentId: agentProfile.id,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      title: 'Studio étudiant meublé rénové à neuf — Vieux Lyon',
      description: 'Idéal étudiant ou investisseur. Studio de 18m² entièrement rénové et meublé avec goût. Pièce principale lumineuse avec coin nuit séparé, kitchenette équipée, salle de douche avec WC. À 2 minutes du métro.',
      status: PropertyStatus.AVAILABLE,
      yearBuilt: 1965,
      floor: 2,
      totalFloors: 5,
      bedrooms: 0,
      bathrooms: 1,
      rooms: 1,
      area: 18.0,
      energyRating: 'D',
      ghgRating: 'C',
      isFurnished: true,
      typeId: studioType.id,
      locationId: loc3.id,
      ownerId: ownerProfile.id,
      agencyId: agency.id,
      agentId: agentProfile.id,
    },
  });

  // ── 9. Property Media ──
  console.log('📸 Creating property media...');

  await prisma.propertyMedia.createMany({
    data: [
      { propertyId: prop1.id, url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', type: MediaType.IMAGE, isPrimary: true, sortOrder: 0, title: 'Séjour lumineux' },
      { propertyId: prop1.id, url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', type: MediaType.IMAGE, sortOrder: 1, title: 'Cuisine aménagée' },
      { propertyId: prop1.id, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', type: MediaType.IMAGE, sortOrder: 2, title: 'Chambre principale' },
      { propertyId: prop2.id, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', type: MediaType.IMAGE, isPrimary: true, sortOrder: 0, title: 'Vue extérieure' },
      { propertyId: prop2.id, url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', type: MediaType.IMAGE, sortOrder: 1, title: 'Jardin et piscine' },
      { propertyId: prop3.id, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', type: MediaType.IMAGE, isPrimary: true, sortOrder: 0, title: 'Vue générale' },
    ],
  });

  // ── 10. Property Features ──
  console.log('✨ Creating property features...');

  await prisma.propertyFeature.createMany({
    data: [
      { propertyId: prop1.id, name: 'Parquet massif', category: 'Intérieur' },
      { propertyId: prop1.id, name: 'Double vitrage', category: 'Isolation' },
      { propertyId: prop1.id, name: 'Interphone', category: 'Sécurité' },
      { propertyId: prop1.id, name: 'Fibre optique', category: 'Connectivité' },
      { propertyId: prop2.id, name: 'Piscine chauffée', category: 'Extérieur', value: '8x4m' },
      { propertyId: prop2.id, name: 'Climatisation réversible', category: 'Confort' },
      { propertyId: prop2.id, name: 'Portail automatique', category: 'Sécurité' },
      { propertyId: prop2.id, name: 'Panneaux solaires', category: 'Énergie', value: '6 kWc' },
      { propertyId: prop3.id, name: 'Meublé', category: 'Intérieur' },
      { propertyId: prop3.id, name: 'Lave-linge', category: 'Équipement' },
    ],
  });

  // ── 11. Listings ──
  console.log('📋 Creating listings...');

  const listing1 = await prisma.listing.create({
    data: {
      propertyId: prop1.id,
      transactionType: TransactionType.RENT,
      status: ListingStatus.ACTIVE,
      visibility: ListingVisibility.PUBLIC,
      slug: 't3-canal-saint-martin-paris-10',
      viewsCount: 156,
      contactCount: 12,
      publishedAt: new Date('2026-08-01'),
      price: {
        create: {
          price: 1850,
          pricePerSqm: 27.01,
          deposit: 1850,
          agencyFees: 1850,
          charges: 180,
          chargesIncluded: false,
        },
      },
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      propertyId: prop2.id,
      transactionType: TransactionType.SALE,
      status: ListingStatus.ACTIVE,
      visibility: ListingVisibility.PREMIUM,
      slug: 'villa-contemporaine-piscine-nantes',
      isFeatured: true,
      viewsCount: 342,
      contactCount: 28,
      publishedAt: new Date('2026-07-15'),
      price: {
        create: {
          price: 520000,
          pricePerSqm: 3586.21,
          isNegotiable: true,
          notaryFees: 41600,
          taxeFonciere: 2800,
          agencyFees: 26000,
        },
      },
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      propertyId: prop3.id,
      transactionType: TransactionType.RENT,
      status: ListingStatus.ACTIVE,
      visibility: ListingVisibility.PUBLIC,
      slug: 'studio-meuble-vieux-lyon',
      viewsCount: 89,
      contactCount: 5,
      publishedAt: new Date('2026-08-10'),
      price: {
        create: {
          price: 580,
          pricePerSqm: 32.22,
          deposit: 580,
          charges: 40,
          chargesIncluded: true,
        },
      },
    },
  });

  // ── 12. Favorites ──
  console.log('❤️  Creating favorites...');

  await prisma.favorite.createMany({
    data: [
      { userId: clientUser.id, listingId: listing1.id },
      { userId: clientUser.id, listingId: listing2.id },
      { userId: clientUser2.id, listingId: listing2.id },
    ],
  });

  // ── 13. Saved Searches ──
  console.log('🔍 Creating saved searches...');

  await prisma.savedSearch.create({
    data: {
      userId: clientUser.id,
      name: 'Appart 3 pièces Paris',
      transactionType: TransactionType.RENT,
      city: 'Paris',
      minPrice: 1500,
      maxPrice: 2200,
      minRooms: 3,
    },
  });

  // ── 14. Visits ──
  console.log('📅 Creating visits...');

  await prisma.visit.create({
    data: {
      listingId: listing1.id,
      clientId: clientUser.id,
      agentId: agentProfile.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      duration: 30,
      type: VisitType.IN_PERSON,
      status: VisitStatus.CONFIRMED,
      clientNotes: 'Je souhaiterais visiter en fin d\'après-midi si possible.',
    },
  });

  await prisma.visit.create({
    data: {
      listingId: listing2.id,
      clientId: clientUser2.id,
      agentId: agentProfile.id,
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      duration: 45,
      type: VisitType.IN_PERSON,
      status: VisitStatus.PENDING,
      clientNotes: 'Nous sommes disponibles le matin uniquement.',
    },
  });

  // ── 15. Inquiries ──
  console.log('❓ Creating inquiries...');

  await prisma.inquiry.create({
    data: {
      listingId: listing2.id,
      clientId: clientUser2.id,
      agentId: agentProfile.id,
      subject: 'Négociation du prix',
      message: 'Bonjour, le prix de la villa est-il négociable ? Nous avons un accord de prêt pour 490 000 €.',
      status: InquiryStatus.IN_PROGRESS,
      response: 'Bonjour Marie, merci pour votre intérêt. Le propriétaire est ouvert à la discussion. Pouvons-nous organiser une visite ?',
      respondedAt: new Date(),
    },
  });

  // ── 16. Conversation & Messages ──
  console.log('💬 Creating conversations...');

  const convo = await prisma.conversation.create({
    data: {
      subject: 'Au sujet du T3 Canal Saint-Martin',
      listingRef: listing1.id,
    },
  });

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: convo.id, userId: clientUser.id },
      { conversationId: convo.id, userId: agentUser.id },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: convo.id,
        senderId: clientUser.id,
        content: 'Bonjour Pierre, est-ce que les charges incluent le chauffage ?',
      },
      {
        conversationId: convo.id,
        senderId: agentUser.id,
        content: 'Bonjour Jean, les charges de 180€ couvrent l\'eau froide, l\'entretien des parties communes et l\'ascenseur. Le chauffage est individuel (gaz). La facture annuelle est d\'environ 600€.',
      },
    ],
  });

  // ── 17. Notifications ──
  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: clientUser.id,
        type: NotificationType.VISIT_CONFIRMED,
        title: 'Visite confirmée',
        content: 'Votre visite du T3 Canal Saint-Martin a été confirmée par l\'agent.',
        link: `/listings/${listing1.id}`,
      },
      {
        userId: agentUser.id,
        type: NotificationType.INQUIRY_RECEIVED,
        title: 'Nouvelle demande d\'information',
        content: 'Marie Lambert a posé une question sur la villa à Nantes.',
        link: `/listings/${listing2.id}`,
      },
    ],
  });

  // ── 18. Audit Log ──
  console.log('📝 Creating audit log entries...');

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: AuditAction.CREATE,
        entityType: 'Agency',
        entityId: agency.id,
        newValues: { name: agency.name },
      },
      {
        userId: ownerUser.id,
        action: AuditAction.CREATE,
        entityType: 'Property',
        entityId: prop1.id,
        newValues: { title: prop1.title },
      },
    ],
  });

  console.log('\n✅ Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Users:           ${await prisma.user.count()}`);
  console.log(`   Agency:          ${await prisma.agency.count()}`);
  console.log(`   Property Types:  ${await prisma.propertyType.count()}`);
  console.log(`   Properties:      ${await prisma.property.count()}`);
  console.log(`   Locations:       ${await prisma.location.count()}`);
  console.log(`   Property Media:  ${await prisma.propertyMedia.count()}`);
  console.log(`   Property Feat.:  ${await prisma.propertyFeature.count()}`);
  console.log(`   Listings:        ${await prisma.listing.count()}`);
  console.log(`   Listing Prices:  ${await prisma.listingPrice.count()}`);
  console.log(`   Favorites:       ${await prisma.favorite.count()}`);
  console.log(`   Saved Searches:  ${await prisma.savedSearch.count()}`);
  console.log(`   Visits:          ${await prisma.visit.count()}`);
  console.log(`   Inquiries:       ${await prisma.inquiry.count()}`);
  console.log(`   Conversations:   ${await prisma.conversation.count()}`);
  console.log(`   Messages:        ${await prisma.message.count()}`);
  console.log(`   Notifications:   ${await prisma.notification.count()}`);
  console.log(`   Audit Logs:      ${await prisma.auditLog.count()}`);
  console.log('');
  console.log('🔑 All test accounts use password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
