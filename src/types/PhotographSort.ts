export type PhotographSortField = 'createdAt' | 'updatedAt' | 'title';

export type SortDirection = 'asc' | 'desc';

export type PhotographSort = {
    field: PhotographSortField;
    direction: SortDirection;
};

/*
 * Mirrors the server's default (GetQuery). Sending it explicitly keeps the
 * client and the label in the dropdown honest even if the server default
 * ever changes.
 */
export const DEFAULT_PHOTOGRAPH_SORT: PhotographSort = {field: 'createdAt', direction: 'desc'};

export const isSamePhotographSort = (a: PhotographSort, b: PhotographSort): boolean => {
    return a.field === b.field && a.direction === b.direction;
};
