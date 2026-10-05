
import axios from 'axios';
import { api } from './config';
import type {PhotographDTO} from "../types";
import type {DescriptionDTO} from "../types/DescriptionDTO.ts";
import type {PhotographSort, PhotographSortField, SortDirection} from "../types/PhotographSort.ts";

let cachedToken: string | null = null;

export const getAnonymousToken = async (): Promise<string> => {
    if (cachedToken) return cachedToken;
    const response = await axios.get<{ token: string }>(api.url("/api/login/anonymous"));

    cachedToken = response.data.token;
    return cachedToken;
};

interface postLoginPayload {
    username: string,
    password: string,
}

export const postLogin = async({ username, password }: postLoginPayload): Promise<string> => {
    const response = await axios.post<{ token: string}>(
        api.url("/api/login_check"),
        {
            username: username,
            password: password,
        }
    );

    return response.data.token;
};

interface getPhotographsInput {
    title?: string,
    sort?: PhotographSort,
    signal?: AbortSignal,
}

interface getPhotographsParams {
    title?: string,
    sortField?: PhotographSortField,
    sortDirection?: SortDirection,
}

export const getPhotographs = async ({ title, sort, signal }: getPhotographsInput = {}): Promise<PhotographDTO[]> => {
    const token = await getAnonymousToken();

    const response = await axios.get<PhotographDTO[]>(
        api.url("/photographs"),
        {
            headers: { Authorization: `Bearer ${token}` },
            params: createGetPhotographsParams(title, sort),
            signal,
        }
    );

    return response.data;
};

/*
 * Parameters that are not set are left out of the query string entirely, so
 * the server applies its own defaults instead of receiving empty values.
 */
const createGetPhotographsParams = (title?: string, sort?: PhotographSort): getPhotographsParams | undefined => {
    const params: getPhotographsParams = {};

    const trimmedTitle = title?.trim();
    if (trimmedTitle) {
        params.title = trimmedTitle;
    }

    if (sort) {
        params.sortField = sort.field;
        params.sortDirection = sort.direction;
    }

    return Object.keys(params).length > 0 ? params : undefined;
};

interface postPhotographInput {
    token: string,
    uuid: string,
    title: string,
    description: string,
    file: File,
}

export const postPhotograph = async({ token, uuid, title, description, file }: postPhotographInput): Promise<PhotographDTO> => {

    const formData = new FormData();
    formData.append("uuid", uuid);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("0", file);

    const response = await axios.post(
        api.url("/photographs"),
        formData,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }
    );

    return response.data;
};


interface deletePhotographInput {
    token: string,
    uuid: string,
}

export const deletePhotograph = async({ token, uuid }: deletePhotographInput): Promise<string> => {

    const response = await axios.delete(
        api.url(`/photographs/${uuid}`),
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }
    );

    return response.data;
};

interface editPhotographInput {
    token: string,
    uuid: string,
    title: string,
    description: string | null,
}

export const patchPhotograph = async({token, uuid, title, description}: editPhotographInput): Promise<PhotographDTO> => {
    const response = await axios.patch(
        api.url(`/photographs/${uuid}`),
        {title, description},
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }
    )

    return response.data;
}

interface postGenerateDescriptionInput {
    token: string,
    uuid: string,
}

export const postGenerateDescription = async({token, uuid}: postGenerateDescriptionInput): Promise<DescriptionDTO> => {
    const response = await axios.post(
        api.url(`/photographs/${uuid}/generate-description`),
        {},
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }
    )

    return response.data;
}
