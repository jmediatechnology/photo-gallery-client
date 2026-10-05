import type {PhotographSort} from "../../types/PhotographSort.ts";

export interface PhotographSortOption {
    label: string,
    sort: PhotographSort,
}

export const PHOTOGRAPH_SORT_OPTIONS: PhotographSortOption[] = [
    {label: 'Newest first', sort: {field: 'createdAt', direction: 'desc'}},
    {label: 'Oldest first', sort: {field: 'createdAt', direction: 'asc'}},
    {label: 'Recently updated', sort: {field: 'updatedAt', direction: 'desc'}},
    {label: 'Least recently updated', sort: {field: 'updatedAt', direction: 'asc'}},
    {label: 'Title A–Z', sort: {field: 'title', direction: 'asc'}},
    {label: 'Title Z–A', sort: {field: 'title', direction: 'desc'}},
];
