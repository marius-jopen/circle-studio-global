// Export all primitive components
export { default as Button } from './Button.svelte';
export { default as Slider } from './Slider.svelte';
export { default as Input } from './Input.svelte';
export { default as Checkbox } from './Checkbox.svelte';
export { default as Select } from './Select.svelte';
export { default as Accordion } from './Accordion.svelte';
export { default as RecordingIndicator } from './RecordingIndicator.svelte';
export { default as Label } from './Label.svelte';
export { default as FileUpload } from './FileUpload.svelte';

// Type definitions for component props
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'fade' | 'record';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'number' | 'email' | 'password' | 'color';
export type CheckboxSize = 'sm' | 'md' | 'lg';
export type AccordionVariant = 'default' | 'controls' | 'bordered';
export type RecordingIndicatorSize = 'sm' | 'md' | 'lg';
export type LabelVariant = 'default' | 'control' | 'section';
export type LabelSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
} 