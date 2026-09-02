import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Helper to generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm">
      {/* Items count summary */}
      <div className="text-xs text-muted-foreground">
        Affichage de <span className="font-semibold text-foreground">{startItem}</span> à{' '}
        <span className="font-semibold text-foreground">{endItem}</span> sur{' '}
        <span className="font-semibold text-foreground">{totalItems}</span> biens
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1 || isLoading}
          onClick={() => onPageChange(1)}
          className="h-8 w-8 p-0 rounded-lg hidden sm:inline-flex"
          title="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2 rounded-lg text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
        </Button>

        {/* Number buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(page)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2 rounded-lg text-xs"
        >
          Suivant <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages || isLoading}
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0 rounded-lg hidden sm:inline-flex"
          title="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Items per page selector */}
      {onLimitChange && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Par page :</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value={9}>9</option>
            <option value={18}>18</option>
            <option value={27}>27</option>
            <option value={45}>45</option>
          </select>
        </div>
      )}
    </div>
  );
}
