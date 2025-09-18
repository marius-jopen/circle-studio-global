import { writable } from 'svelte/store';

export const homeSearchQuery = writable<string>('');

export const mobileSearchOpen = writable<boolean>(false);


