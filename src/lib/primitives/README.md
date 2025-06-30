# UI Primitives

This directory contains reusable UI primitive components for the Circle Studio application. These components provide a consistent design system and can be used throughout the application.

## Components

### Button
A versatile button component with multiple variants and states.

```svelte
<Button variant="primary" size="md" on:click={handleClick}>
  Click me
</Button>

<Button variant="record" recording={isRecording} on:click={toggleRecording}>
  {isRecording ? 'Stop' : 'Record'}
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'fade' | 'record'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `recording`: boolean (for record variant)
- `rounded`: boolean
- `type`: 'button' | 'submit' | 'reset'

### Slider
A range input with label and value display.

```svelte
<Slider 
  label="Font Size" 
  bind:value={fontSize}
  min={2}
  max={20}
  step={0.1}
  unit="%"
  precision={2}
  tooltip="Adjust the font size"
/>
```

**Props:**
- `label`: string (required)
- `value`: number (required)
- `min`: number (default: 0)
- `max`: number (default: 100)
- `step`: number (default: 1)
- `unit`: string (default: '')
- `precision`: number (default: 2)
- `tooltip`: string (default: '')
- `disabled`: boolean (default: false)

### Input
A flexible input component supporting multiple types.

```svelte
<Input 
  type="text" 
  label="Name" 
  bind:value={name}
  placeholder="Enter your name"
  required
/>

<Input 
  type="number" 
  label="Age" 
  bind:value={age}
  min={0}
  max={120}
/>

<Input 
  type="color" 
  label="Color" 
  bind:value={color}
  fullWidth={false}
/>
```

**Props:**
- `type`: 'text' | 'number' | 'email' | 'password' | 'color'
- `label`: string (default: '')
- `value`: string | number (required)
- `placeholder`: string (default: '')
- `disabled`: boolean (default: false)
- `required`: boolean (default: false)
- `min`, `max`, `step`: number (for number inputs)
- `tooltip`: string (default: '')
- `error`: string (default: '')
- `fullWidth`: boolean (default: true)

### Checkbox
A styled checkbox with label and tooltip support.

```svelte
<Checkbox 
  bind:checked={isEnabled}
  label="Enable feature"
  tooltip="This enables the advanced feature"
  size="md"
/>
```

**Props:**
- `checked`: boolean (required)
- `label`: string (default: '')
- `disabled`: boolean (default: false)
- `tooltip`: string (default: '')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

### Select
A dropdown select component with options.

```svelte
<Select 
  label="Animation Type"
  bind:value={animationType}
  options={[
    { value: 'sin', label: 'Sinusoidal' },
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in', label: 'Ease In', disabled: true }
  ]}
  placeholder="Choose animation..."
/>
```

**Props:**
- `label`: string (default: '')
- `value`: any (required)
- `options`: SelectOption[] (required)
- `disabled`: boolean (default: false)
- `placeholder`: string (default: 'Select an option...')
- `tooltip`: string (default: '')
- `error`: string (default: '')
- `required`: boolean (default: false)

### Accordion
A collapsible content container.

```svelte
<Accordion title="Advanced Settings" variant="controls" open={true}>
  <p>Accordion content goes here</p>
</Accordion>
```

**Props:**
- `title`: string (required)
- `open`: boolean (default: false)
- `variant`: 'default' | 'controls' | 'bordered' (default: 'default')
- `disabled`: boolean (default: false)
- `icon`: string (default: '▼')

### RecordingIndicator
Shows recording status with animated dot and elapsed time.

```svelte
<RecordingIndicator 
  isRecording={true} 
  elapsedTime={120} 
  size="md" 
/>
```

**Props:**
- `isRecording`: boolean (default: false)
- `elapsedTime`: number (default: 0)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

## Usage

Import the components you need:

```typescript
import { Button, Slider, Input, Checkbox, Select, Accordion, RecordingIndicator } from '$lib/primitives';
```

Or import all:

```typescript
import * as Primitives from '$lib/primitives';
```

## Styling

All components follow a consistent design system:
- Primary color: #4a90e2
- Border radius: 8px-12px
- Consistent spacing and typography
- Hover and focus states
- Accessibility support

## Accessibility

All components include:
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance

## Example

See `BigWheelExample.svelte` for a complete example of how to use these primitives to replace the original BigWheel controls. 