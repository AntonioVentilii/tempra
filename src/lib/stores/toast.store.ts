import { writable } from 'svelte/store';

const TOAST_MS = 2400;

export const toastStore = writable<string | undefined>(undefined);

let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = (message: string) => {
	toastStore.set(message);
	clearTimeout(timer);
	timer = setTimeout(() => toastStore.set(undefined), TOAST_MS);
};
