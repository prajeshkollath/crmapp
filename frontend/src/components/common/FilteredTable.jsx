import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { X, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const FilteredTable = ({
  columns,
  data,
  loading = false,
  total = 0,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  filters = {},
  onFilterChange,
  onClearFilters,
  rowActions = [],
  emptyState,
  onRowClick,
  fillHeight = false,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

  const handleFilterChange = (columnId, value) => onFilterChange?.({ ...filters, [columnId]: value });
  const clearFilter = (columnId) => { const newFilters = { ...filters }; delete newFilters[columnId]; onFilterChange?.(newFilters); };

  return (
    <div className={cn('flex flex-col border rounded-lg bg-card', fillHeight && 'h-full')}>
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/30 shrink-0">
          <span className="text-xs text-muted-foreground">{Object.values(filters).filter(v => v && v !== 'all').length} filter(s) active</span>
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" />Clear all</Button>
        </div>
      )}

      {/* Table Scroll Container */}
      <div className="flex-1 overflow-auto min-h-0">
        <Table className="min-w-[1000px]">
          <TableHeader className="sticky top-0 z-20 bg-card">
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((col) => <TableHead key={col.id} className="font-semibold text-xs uppercase tracking-wider text-muted-foreground h-9 whitespace-nowrap" style={{ width: col.width, minWidth: col.minWidth }}>{col.header}</TableHead>)}
              {rowActions.length > 0 && <TableHead className="w-[50px] text-right text-xs uppercase tracking-wider text-muted-foreground h-9">Actions</TableHead>}
            </TableRow>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => <TableHead key={`filter-${col.id}`} className="h-9 py-1" style={{ width: col.width, minWidth: col.minWidth }}>{col.filterable !== false && renderFilter(col, filters, handleFilterChange, clearFilter)}</TableHead>)}
              {rowActions.length > 0 && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)} className="h-20 text-center"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)} className="h-24 text-center">{emptyState || <div className="text-muted-foreground"><p className="font-medium">No data found</p><p className="text-sm mt-1">Try adjusting your filters</p></div>}</TableCell></TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={row.id || i} className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-muted/50')} onClick={() => onRowClick?.(row)}>
                  {columns.map((col) => <TableCell key={`${row.id}-${col.id}`} className="py-2">{col.render ? col.render(row) : row[col.id]}</TableCell>)}
                  {rowActions.length > 0 && (
                    <TableCell className="text-right py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          {rowActions.map((action) => <DropdownMenuItem key={action.label} onClick={(e) => { e.stopPropagation(); action.onClick(row); }} className={cn('gap-2 text-sm', action.destructive && 'text-destructive focus:text-destructive')}>{action.icon && <action.icon className="h-4 w-4" />}{action.label}</DropdownMenuItem>)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-3 py-1.5 bg-card shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows:</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange?.(Number(v))}>
            <SelectTrigger className="h-7 w-[60px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{[5, 10, 25, 50].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{total === 0 ? '0' : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, total)}`} of {total}</span>
          <div className="flex items-center gap-0.5">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange?.(0)} disabled={page === 0}><ChevronsLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange?.(page - 1)} disabled={page === 0}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages - 1}><ChevronRight className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange?.(totalPages - 1)} disabled={page >= totalPages - 1}><ChevronsRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function renderFilter(column, filters, onChange, onClear) {
  const value = filters[column.id] || '';
  if (column.filterType === 'select' && column.filterOptions) {
    return <Select value={value || 'all'} onValueChange={(v) => onChange(column.id, v === 'all' ? '' : v)}><SelectTrigger className="h-6 text-xs bg-background"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{column.filterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>;
  }
  return <div className="relative"><Input type="text" value={value} onChange={(e) => onChange(column.id, e.target.value)} placeholder={column.filterPlaceholder || 'Filter...'} className="h-6 text-xs pr-6 bg-background" />{value && <button onClick={() => onClear(column.id)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}</div>;
}

export default FilteredTable;
