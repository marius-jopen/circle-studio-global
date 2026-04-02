import { writable } from 'svelte/store';

export const homeSearchQuery = writable<string>('');

export const mobileSearchOpen = writable<boolean>(false);

export const playInputActive = writable<boolean>(false);

/** True when search is active and has zero results - used to show black header logo */
export const searchZeroResults = writable<boolean>(false);

/** True when AboutContent slice is visible - used to switch nav bg on about page */
export const aboutContentVisible = writable<boolean>(false);


