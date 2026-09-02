/**
 * Interface abstraite du service de stockage de fichiers.
 *
 * Cette abstraction découple totalement la logique métier du fournisseur de stockage.
 * Pour changer de fournisseur (AWS S3 → Cloudinary, MinIO, R2, Azure Blob…),
 * il suffit de créer une nouvelle implémentation de cette interface et de la
 * déclarer dans le module. Zéro modification du code métier.
 *
 * Implémentations disponibles :
 *  - S3StorageService  : AWS S3 / MinIO / Cloudflare R2 (S3-compatible)
 *  - LocalStorageService : Stockage local sur disque (tests / développement)
 *
 * Implémentations futures planifiées :
 *  - CloudinaryStorageService
 *  - AzureBlobStorageService
 *  - GoogleCloudStorageService
 */
export abstract class StorageService {
  /**
   * Upload un fichier vers le fournisseur de stockage.
   * @param file Buffer du fichier binaire
   * @param options Options d'upload (nom, type MIME, répertoire destination)
   * @returns Clé de stockage unique (`key`) et URL publique d'accès (`url`)
   */
  abstract upload(
    file: Buffer,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult>;

  /**
   * Supprime un fichier depuis le fournisseur de stockage.
   * @param key Clé unique du fichier (retournée par upload)
   */
  abstract delete(key: string): Promise<void>;

  /**
   * Retourne l'URL publique d'accès à un fichier.
   * @param key Clé unique du fichier
   */
  abstract getUrl(key: string): string;
}

export interface StorageUploadOptions {
  /** Nom du fichier destination */
  fileName: string;
  /** Type MIME du fichier (image/jpeg, video/mp4, application/pdf…) */
  mimeType: string;
  /** Répertoire de destination dans le bucket (ex: 'properties/photos') */
  folder?: string;
  /** Rendre le fichier public en lecture */
  isPublic?: boolean;
}

export interface StorageUploadResult {
  /** Clé unique identifiant le fichier dans le stockage (chemin relatif au bucket) */
  key: string;
  /** URL publique complète d'accès au fichier */
  url: string;
  /** Taille du fichier en octets */
  size?: number;
}
