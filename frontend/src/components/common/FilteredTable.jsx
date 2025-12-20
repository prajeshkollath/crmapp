import React, { useState, useMemo } from 'react';
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
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
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
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

  const handleFilterChange = (columnId, value) => {
    onFilterChange?.({ ...filters, [columnId]: value });
  };

  const clearFilter = (columnId) => {
    const newFilters = { ...filters };
    delete newFilters[columnId];
    onFilterChange?.(newFilters);
  };

  return (
    <Card className="w-full overflow-hidden">
      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
          <span className="text-sm text-muted-foreground">
            {Object.values(filters).filter(v => v && v !== 'all').length} filter(s) active
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </Button>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px]">
          {/* Column Headers */}
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    'font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11 whitespace-nowrap',
                    column.className
                  )}
                  style={{ width: column.width, minWidth: column.minWidth }}
                >
                  {column.header}
                </TableHead>
              ))}
              {rowActions.length > 0 && (
                <TableHead className="w-[60px] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground h-11">
                  Actions
                </TableHead>
              )}
            </TableRow>

            {/* Filter Row */}
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={`filter-${column.id}`}
                  className="h-12 py-2"
                  style={{ width: column.width, minWidth: column.minWidth }}
                >
                  {column.filterable !== false && renderFilter(column, filters, handleFilterChange, clearFilter)}
                </TableHead>
              ))}
              {rowActions.length > 0 && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)}
                  className="h-48 text-center"
                >
                  {emptyState || (
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium">No data found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={row.id || rowIndex}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${row.id}-${column.id}`}
                      className={cn('py-4', column.cellClassName)}
                    >
                      {column.render ? column.render(row) : row[column.id]}
                    </TableCell>
                  ))}
                  {rowActions.length > 0 && (
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {rowActions.map((action) => (
                            <DropdownMenuItem
                              key={action.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              className={cn(
                                'gap-2',
                                action.destructive && 'text-destructive focus:text-destructive'
                              )}
                            >
                              {action.icon && <action.icon className="h-4 w-4" />}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
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
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {total === 0 ? '0' : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, total)}`} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(0)}
              disabled={page === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Filter renderer based on column type
function renderFilter(column, filters, onChange, onClear) {
  const value = filters[column.id] || '';

  if (column.filterType === 'select' && column.filterOptions) {
    return (
      <Select
        value={value || 'all'}
        onValueChange={(v) => onChange(column.id, v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-8 text-xs bg-background">
          <SelectValue placeholder={column.filterPlaceholder || 'All'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {column.filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default text filter
  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(column.id, e.target.value)}
        placeholder={column.filterPlaceholder || 'Filter...'}
        className="h-8 text-xs pr-7 bg-background"
      />
      {value && (
        <button
          onClick={() => onClear(column.id)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default FilteredTable;
