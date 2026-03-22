import { store } from '../service/store';

const API_DOMAIN = 'http://localhost:9999/'

export const get = async (path) => {
    const token = store.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(API_DOMAIN + path, {
        headers
    });
    const result = await response.json();
    return result;
}
export const post = async(path,option) =>{
    const token = store.getToken();
    const headers = {
        Accept: 'application/json',
        "Content-Type": "application/json"
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(API_DOMAIN + path, {
        method: 'POST',
        headers,
        body: JSON.stringify(option)
    });
    const result = await response.json();
    return result
}

export const postFormData = async(path, formData) => {
    const token = store.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(API_DOMAIN + path, {
        method: 'POST',
        headers,
        body: formData
    });
    const result = await response.json();
    return result;
}
export const patch = async(path,option,id) =>{
    const token = store.getToken();
    const headers = {
        Accept: 'application/json',
        "Content-Type": "application/json"
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = id ? `${API_DOMAIN}${path}/${id}` : `${API_DOMAIN}${path}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(option)
    })
    const result = response.json();
    return result
}
export const put = async(path,option,id) =>{
    const token = store.getToken();
    const headers = {
        Accept: 'application/json',
        "Content-Type": "application/json"
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = id ? `${API_DOMAIN}${path}/${id}` : `${API_DOMAIN}${path}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(option)
    });
    const result = await response.json();
    return result
}
export const dele = async(path,id) => {
    const token = store.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = id ? `${API_DOMAIN}${path}/${id}` : `${API_DOMAIN}${path}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers
    })
    const results = response.json();
    return results
}