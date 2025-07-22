import { p as push, j as bind_props, c as pop, k as attr_class, d as attr, l as slot, m as stringify, f as escape_html, e as ensure_array_like, n as maybe_selected, o as copy_payload, q as assign_payload, t as attr_style } from "../../../chunks/index2.js";
import { isFilled } from "@prismicio/client";
import { V as VideoPreview, P as PrismicImage, S as SliceZone, c as components } from "../../../chunks/index4.js";
import { h as fallback } from "../../../chunks/utils.js";
function TextCircle($$payload, $$props) {
  push();
  let text = fallback($$props["text"], "circle studio");
  let fontSize = fallback($$props["fontSize"], 40);
  let radius = fallback($$props["radius"], 180);
  let rotationSpeed = fallback($$props["rotationSpeed"], () => -0.2, true);
  let spacingAmplitudePercent = fallback($$props["spacingAmplitudePercent"], 2);
  let spacingSpeed = fallback($$props["spacingSpeed"], 0.28);
  let rotationStart = fallback($$props["rotationStart"], 0);
  let animationType = fallback($$props["animationType"], "sin");
  let containerSize = fallback($$props["containerSize"], 500);
  let paused = fallback($$props["paused"], false);
  let textColor = fallback($$props["textColor"], "#000000");
  let fadeInTime = fallback($$props["fadeInTime"], 3);
  let fadeOutTime = fallback($$props["fadeOutTime"], 3);
  let pauseTime = fallback($$props["pauseTime"], 2);
  let visibleTime = fallback($$props["visibleTime"], 4);
  let manualMode = fallback($$props["manualMode"], false);
  let triggerFadeIn = fallback($$props["triggerFadeIn"], false);
  let triggerFadeOut = fallback($$props["triggerFadeOut"], false);
  let letterOpacities = [];
  let letterFadeStartTimes = [];
  function generateRandomFadeTimes() {
    const letters = text.split("");
    letterFadeStartTimes = letters.map((_, i) => Math.random());
    letterFadeStartTimes.sort((a, b) => a - b);
  }
  function captureCanvas(highRes = false) {
    return null;
  }
  {
    const letters = text.split("");
    if (letterOpacities.length !== letters.length) {
      letterOpacities = new Array(letters.length).fill(0);
      letterFadeStartTimes = new Array(letters.length).fill(0);
      generateRandomFadeTimes();
    }
  }
  $$payload.out += `<canvas class="svelte-y0338"></canvas>`;
  bind_props($$props, {
    text,
    fontSize,
    radius,
    rotationSpeed,
    spacingAmplitudePercent,
    spacingSpeed,
    rotationStart,
    animationType,
    containerSize,
    paused,
    textColor,
    fadeInTime,
    fadeOutTime,
    pauseTime,
    visibleTime,
    manualMode,
    triggerFadeIn,
    triggerFadeOut,
    captureCanvas
  });
  pop();
}
function Button($$payload, $$props) {
  let variant = fallback($$props["variant"], "primary");
  let size = fallback($$props["size"], "md");
  let disabled = fallback($$props["disabled"], false);
  let recording = fallback($$props["recording"], false);
  let rounded = fallback($$props["rounded"], false);
  let type = fallback($$props["type"], "button");
  $$payload.out += `<button${attr_class(`inline-flex items-center justify-center gap-2 font-bold border-0 cursor-pointer transition-all duration-200 font-inherit no-underline ${stringify(size === "sm" ? "px-2 py-1 text-sm" : size === "lg" ? "px-6 py-3 text-lg" : "px-4 py-2 text-base")} ${stringify(rounded ? "rounded-full aspect-square p-2" : "rounded-full")} ${stringify(variant === "primary" ? "bg-gray-400 text-white hover:bg-gray-600" : "")} ${stringify(variant === "secondary" ? "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200" : "")} ${stringify(variant === "danger" ? "bg-red-400 text-white hover:bg-red-600" : "")} ${stringify(variant === "fade" ? "bg-blue-400 text-white hover:bg-blue-600" : "")} ${stringify(variant === "record" ? (recording ? "bg-blue-600 animate-pulse" : "bg-red-400 hover:bg-red-600") + " text-white" : "")} ${stringify(disabled ? "opacity-60 cursor-not-allowed" : "")}`)}${attr("disabled", disabled, true)}${attr("type", type)}><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></button>`;
  bind_props($$props, {
    variant,
    size,
    disabled,
    recording,
    rounded,
    type
  });
}
function Slider($$payload, $$props) {
  push();
  let displayValue;
  let label = $$props["label"];
  let value = $$props["value"];
  let min = fallback($$props["min"], 0);
  let max = fallback($$props["max"], 100);
  let step = fallback($$props["step"], 1);
  let unit = fallback($$props["unit"], "");
  let precision = fallback($$props["precision"], 2);
  let tooltip = fallback($$props["tooltip"], "");
  let disabled = fallback($$props["disabled"], false);
  displayValue = unit ? `${value.toFixed(precision)}${unit}` : value.toFixed(precision);
  $$payload.out += `<label${attr_class(`block border border-gray-300 rounded-xl p-2 mb-2 bg-gray-50 transition-all duration-200 ${stringify(disabled ? "opacity-60 cursor-not-allowed" : "hover:border-blue-500 hover:bg-blue-50")}`)}><div class="flex justify-between items-center mb-1"><span class="font-medium text-gray-700 text-sm">${escape_html(label)}: ${escape_html(displayValue)}</span> `;
  if (tooltip) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="text-xs text-gray-500">${escape_html(tooltip)}</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <input type="range"${attr("min", min)}${attr("max", max)}${attr("step", step)}${attr("disabled", disabled, true)}${attr("value", value)} class="w-full h-2 bg-gray-300 rounded-md appearance-none cursor-pointer [&amp;::-webkit-slider-thumb]:appearance-none [&amp;::-webkit-slider-thumb]:w-5 [&amp;::-webkit-slider-thumb]:h-5 [&amp;::-webkit-slider-thumb]:rounded-full [&amp;::-webkit-slider-thumb]:bg-blue-500 [&amp;::-webkit-slider-thumb]:cursor-pointer [&amp;::-webkit-slider-thumb]:border-2 [&amp;::-webkit-slider-thumb]:border-white [&amp;::-webkit-slider-thumb]:shadow-md [&amp;::-webkit-slider-thumb]:transition-all [&amp;::-webkit-slider-thumb]:hover:scale-110 [&amp;::-webkit-slider-thumb]:hover:bg-blue-600 [&amp;::-moz-range-thumb]:w-5 [&amp;::-moz-range-thumb]:h-5 [&amp;::-moz-range-thumb]:rounded-full [&amp;::-moz-range-thumb]:bg-blue-500 [&amp;::-moz-range-thumb]:cursor-pointer [&amp;::-moz-range-thumb]:border-2 [&amp;::-moz-range-thumb]:border-white [&amp;::-moz-range-thumb]:shadow-md [&amp;::-moz-range-thumb]:transition-all [&amp;::-moz-range-thumb]:hover:scale-110 [&amp;::-moz-range-thumb]:hover:bg-blue-600 [&amp;::-moz-range-track]:h-2 [&amp;::-moz-range-track]:rounded-md [&amp;::-moz-range-track]:bg-gray-300 disabled:cursor-not-allowed outline-none"/></label>`;
  bind_props($$props, {
    label,
    value,
    min,
    max,
    step,
    unit,
    precision,
    tooltip,
    disabled
  });
  pop();
}
function Input($$payload, $$props) {
  let type = fallback($$props["type"], "text");
  let label = fallback($$props["label"], "");
  let value = fallback($$props["value"], "");
  let placeholder = fallback($$props["placeholder"], "");
  let disabled = fallback($$props["disabled"], false);
  let required = fallback($$props["required"], false);
  let min = fallback($$props["min"], void 0);
  let max = fallback($$props["max"], void 0);
  let step = fallback($$props["step"], void 0);
  let tooltip = fallback($$props["tooltip"], "");
  let error = fallback($$props["error"], "");
  let fullWidth = fallback($$props["fullWidth"], true);
  $$payload.out += `<div${attr_class(`flex flex-col gap-1 ${stringify(fullWidth ? "w-full" : "")}`)}>`;
  if (label) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-between items-center"><label${attr("for", `input-${stringify(Math.random())}`)} class="font-medium text-gray-700 text-sm">${escape_html(label)} `;
    if (required) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="text-red-500 ml-0.5">*</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></label> `;
    if (tooltip) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="text-xs text-gray-500">${escape_html(tooltip)}</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (type === "text") {
    $$payload.out += "<!--[-->";
    $$payload.out += `<input${attr("id", `input-${stringify(Math.random())}`)} type="text"${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr("required", required, true)}${attr("value", value)}${attr_class(`p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${stringify(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}`)}/>`;
  } else if (type === "number") {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<input${attr("id", `input-${stringify(Math.random())}`)} type="number"${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr("required", required, true)}${attr("min", min)}${attr("max", max)}${attr("step", step)}${attr("value", value)}${attr_class(`p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${stringify(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}`)}/>`;
  } else if (type === "color") {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<input${attr("id", `input-${stringify(Math.random())}`)} type="color"${attr("disabled", disabled, true)}${attr("value", value)}${attr_class(`w-12 h-10 p-0.5 border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed ${stringify(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}`)}/>`;
  } else if (type === "email") {
    $$payload.out += "<!--[3-->";
    $$payload.out += `<input${attr("id", `input-${stringify(Math.random())}`)} type="email"${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr("required", required, true)}${attr("value", value)}${attr_class(`p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${stringify(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}`)}/>`;
  } else if (type === "password") {
    $$payload.out += "<!--[4-->";
    $$payload.out += `<input${attr("id", `input-${stringify(Math.random())}`)} type="password"${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr("required", required, true)}${attr("value", value)}${attr_class(`p-2 border border-gray-300 rounded-lg text-base font-inherit transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${stringify(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}`)}/>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (error) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="text-xs text-red-500 mt-1">${escape_html(error)}</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    type,
    label,
    value,
    placeholder,
    disabled,
    required,
    min,
    max,
    step,
    tooltip,
    error,
    fullWidth
  });
}
function Checkbox($$payload, $$props) {
  let checked = fallback($$props["checked"], false);
  let label = fallback($$props["label"], "");
  let disabled = fallback($$props["disabled"], false);
  let tooltip = fallback($$props["tooltip"], "");
  let size = fallback($$props["size"], "md");
  $$payload.out += `<label${attr_class(`flex items-center cursor-pointer select-none gap-2 transition-all duration-200 ${stringify(disabled ? "opacity-60 cursor-not-allowed" : "")}`)}><input type="checkbox"${attr("checked", checked, true)}${attr("disabled", disabled, true)} class="sr-only"/> <span${attr_class(`relative bg-white border-2 border-gray-300 rounded transition-all duration-200 flex items-center justify-center ${stringify(size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5")} ${stringify(checked ? "bg-blue-500 border-blue-500" : "hover:border-blue-500 hover:bg-blue-50")} focus-within:ring-2 focus-within:ring-blue-100`)}>`;
  if (checked) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<svg${attr_class(`text-white ${stringify(size === "sm" ? "w-2.5 h-2.5" : size === "lg" ? "w-4 h-4" : "w-3 h-3")}`)} viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></span> `;
  if (label) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="font-medium text-gray-700 text-sm">${escape_html(label)}</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (tooltip) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="text-xs text-gray-500 ml-auto">${escape_html(tooltip)}</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></label>`;
  bind_props($$props, { checked, label, disabled, tooltip, size });
}
function Select($$payload, $$props) {
  let label = fallback($$props["label"], "");
  let value = fallback($$props["value"], "");
  let options = fallback($$props["options"], () => [], true);
  let disabled = fallback($$props["disabled"], false);
  let placeholder = fallback($$props["placeholder"], "Select an option...");
  let tooltip = fallback($$props["tooltip"], "");
  let error = fallback($$props["error"], "");
  let required = fallback($$props["required"], false);
  const each_array = ensure_array_like(options);
  $$payload.out += `<div class="flex flex-col gap-1 w-full">`;
  if (label) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-between items-center"><label${attr("for", `select-${stringify(Math.random())}`)} class="font-medium text-gray-700 text-sm">${escape_html(label)} `;
    if (required) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="text-red-500 ml-0.5">*</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></label> `;
    if (tooltip) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="text-xs text-gray-500">${escape_html(tooltip)}</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="relative inline-block w-full"><select${attr("id", `select-${stringify(Math.random())}`)}${attr("disabled", disabled, true)}${attr("required", required, true)}${attr_class(`appearance-none w-full pr-8 pl-2 py-2 border border-gray-300 rounded-lg text-base font-inherit bg-white cursor-pointer transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed [&::-moz-focus-inner]:border-0 ${stringify(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}`)}>`;
  $$payload.select_value = value;
  if (placeholder) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<option value=""${maybe_selected($$payload, "")} disabled>${escape_html(placeholder)}</option>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out += `<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}${attr("disabled", option.disabled, true)}>${escape_html(option.label)}</option>`;
  }
  $$payload.out += `<!--]-->`;
  $$payload.select_value = void 0;
  $$payload.out += `</select> <div class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none text-gray-600 transition-transform duration-200"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></div> `;
  if (error) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="text-xs text-red-500 mt-1">${escape_html(error)}</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    label,
    value,
    options,
    disabled,
    placeholder,
    tooltip,
    error,
    required
  });
}
function RecordingIndicator($$payload, $$props) {
  push();
  let isRecording = fallback($$props["isRecording"], false);
  let elapsedTime = fallback($$props["elapsedTime"], 0);
  let size = fallback($$props["size"], "md");
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  if (isRecording) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex items-center gap-2"><div${attr_class(`rounded-full bg-red-500 animate-pulse ${stringify(size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3")}`)}></div> <span${attr_class(`font-mono font-bold text-gray-700 ${stringify(size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-lg")}`)}>${escape_html(formatTime(elapsedTime))}</span></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { isRecording, elapsedTime, size });
  pop();
}
function FileUpload($$payload, $$props) {
  push();
  let accept = fallback($$props["accept"], "image/*,video/*");
  let multiple = fallback($$props["multiple"], false);
  let disabled = fallback($$props["disabled"], false);
  let maxSize = fallback($$props["maxSize"], 100);
  let label = fallback($$props["label"], "Upload Media");
  let description = fallback($$props["description"], "Drag and drop an image or video file, or click to browse");
  let currentFile = fallback($$props["currentFile"], null);
  let isDragOver = false;
  $$payload.out += `<div class="file-upload svelte-1kuipsf"><input type="file"${attr("accept", accept)}${attr("multiple", multiple, true)}${attr("disabled", disabled, true)} class="hidden svelte-1kuipsf"/> `;
  if (currentFile) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="current-file svelte-1kuipsf"><div class="file-info svelte-1kuipsf"><div class="flex items-center gap-3"><div class="file-icon svelte-1kuipsf">`;
    if (currentFile.type.startsWith("image/")) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
    }
    $$payload.out += `<!--]--></div> <div class="file-details svelte-1kuipsf"><p class="file-name svelte-1kuipsf">${escape_html(currentFile.name)}</p> <p class="file-type svelte-1kuipsf">${escape_html(currentFile.type)}</p></div></div> <button type="button" class="remove-btn svelte-1kuipsf"${attr("disabled", disabled, true)}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> `;
    if (currentFile.type.startsWith("image/")) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="preview svelte-1kuipsf"><img${attr("src", currentFile.url)} alt="Preview" class="preview-image svelte-1kuipsf"/></div>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<div class="preview svelte-1kuipsf"><video${attr("src", currentFile.url)} class="preview-video svelte-1kuipsf" muted controls><track kind="captions"/></video></div>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div${attr_class("drop-zone svelte-1kuipsf", void 0, { "drag-over": isDragOver, "disabled": disabled })} role="button" tabindex="0"><div class="drop-zone-content svelte-1kuipsf"><div class="upload-icon svelte-1kuipsf"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg></div> <h3 class="upload-label svelte-1kuipsf">${escape_html(label)}</h3> <p class="upload-description svelte-1kuipsf">${escape_html(description)}</p> <p class="upload-formats svelte-1kuipsf">Supports: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)</p> <p class="upload-size svelte-1kuipsf">Max file size: ${escape_html(maxSize)}MB</p></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    accept,
    multiple,
    disabled,
    maxSize,
    label,
    description,
    currentFile
  });
  pop();
}
function BigWheel($$payload, $$props) {
  push();
  let items, globalSettings, uiVisible, containerSizePercent, containerSize, renderCircles, N, maxFontSizePx, fontSize, distanceBetweenCircles, outermostRadius, getRadius, animationPaused, activeTextColor, activeBackgroundColor, activeFadeInTime, activeFadeOutTime, activePauseTime, activeVisibleTime, activeManualMode, activeTriggerFadeIn, activeTriggerFadeOut;
  let config = fallback(
    $$props["config"],
    () => ({
      uiVisible: false,
      items: void 0,
      globalSettings: void 0
    }),
    true
  );
  let showControls = false;
  let paused = false;
  let textColor = "#000000";
  let backgroundColor = "#ffffff";
  let transparentBackground = false;
  let maxFontSizePercent = 20;
  let fontSizePercent = 9;
  let distancePercent = 0.2;
  let useHighResRecording = false;
  let fadeInTime = 3;
  let fadeOutTime = 3;
  let pauseTime = 2;
  let visibleTime = 4;
  let manualMode = false;
  let triggerFadeIn = false;
  let triggerFadeOut = false;
  let circles = [
    {
      text: "circle studio",
      rotationSpeed: 0.2,
      spacingAmplitudePercent: 2,
      spacingSpeed: 0.28,
      rotationStart: 0,
      animationType: "sin"
    }
  ];
  const animationOptions = [
    { value: "sin", label: "Sinusoidal" },
    { value: "linear", label: "Linear" },
    { value: "ease-in", label: "Ease In" },
    { value: "ease-out", label: "Ease Out" },
    { value: "steps", label: "Steps" }
  ];
  const baseContainerSize = 600;
  let exportResolution = 600;
  let isRecording = false;
  let elapsedTime = 0;
  let currentBackgroundFile = null;
  async function startRecording() {
    return;
  }
  items = config.items;
  globalSettings = config.globalSettings;
  uiVisible = config.uiVisible ?? false;
  showControls = uiVisible;
  containerSizePercent = 100;
  containerSize = showControls || !items && !globalSettings ? containerSizePercent / 100 * baseContainerSize : (globalSettings?.containerSizePercent ?? containerSizePercent) / 100 * baseContainerSize;
  renderCircles = showControls || !items && !globalSettings ? circles : items ?? circles;
  N = renderCircles.length;
  maxFontSizePx = containerSize / (2.4 + N);
  maxFontSizePercent = maxFontSizePx / containerSize * 100;
  {
    if ((showControls || !items && !globalSettings) && fontSizePercent > maxFontSizePercent) fontSizePercent = maxFontSizePercent;
  }
  fontSize = showControls || !items && !globalSettings ? fontSizePercent / 100 * containerSize : (globalSettings?.fontSizePercent ?? fontSizePercent) / 100 * containerSize;
  distanceBetweenCircles = showControls || !items && !globalSettings ? distancePercent / 100 * containerSize : (globalSettings?.distancePercent ?? distancePercent) / 100 * containerSize;
  outermostRadius = containerSize / 2 - fontSize * 1.2;
  getRadius = (i) => outermostRadius - i * (fontSize + distanceBetweenCircles);
  animationPaused = showControls || !items && !globalSettings ? paused : globalSettings?.paused ?? paused;
  activeTextColor = showControls || !items && !globalSettings ? textColor : globalSettings?.textColor ?? textColor;
  activeBackgroundColor = showControls || !items && !globalSettings ? transparentBackground ? "transparent" : backgroundColor : globalSettings?.transparentBackground ? "transparent" : globalSettings?.backgroundColor ?? backgroundColor;
  {
    if (globalSettings?.saveStillTrigger) {
      if (globalSettings.exportResolution) {
        exportResolution = globalSettings.exportResolution;
      }
    }
    if (globalSettings?.startRecording && !isRecording) {
      if (globalSettings.exportResolution) {
        exportResolution = globalSettings.exportResolution;
      }
      startRecording();
    }
    if (globalSettings?.stopRecording && isRecording) ;
  }
  showControls || !items && !globalSettings ? exportResolution : globalSettings?.exportResolution ?? exportResolution;
  showControls || !items && !globalSettings ? useHighResRecording : globalSettings?.useHighResRecording ?? useHighResRecording;
  activeFadeInTime = showControls || !items && !globalSettings ? fadeInTime : globalSettings?.fadeInTime ?? fadeInTime;
  activeFadeOutTime = showControls || !items && !globalSettings ? fadeOutTime : globalSettings?.fadeOutTime ?? fadeOutTime;
  activePauseTime = showControls || !items && !globalSettings ? pauseTime : globalSettings?.pauseTime ?? pauseTime;
  activeVisibleTime = showControls || !items && !globalSettings ? visibleTime : globalSettings?.visibleTime ?? visibleTime;
  activeManualMode = showControls || !items && !globalSettings ? manualMode : globalSettings?.manualMode ?? manualMode;
  activeTriggerFadeIn = showControls || !items && !globalSettings ? triggerFadeIn : globalSettings?.triggerFadeIn ?? triggerFadeIn;
  activeTriggerFadeOut = showControls || !items && !globalSettings ? triggerFadeOut : globalSettings?.triggerFadeOut ?? triggerFadeOut;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(renderCircles);
    $$payload2.out += `<div class="flex flex-col lg:flex-row gap-6 h-full w-full max-w-7xl mx-auto p-4"><div class="flex-shrink-0 lg:sticky lg:top-4 lg:self-start"><div class="relative mx-auto rounded-3xl transition-all duration-200 overflow-hidden"${attr_style(`width: ${stringify(containerSize)}px; height: ${stringify(containerSize)}px; ${stringify(activeBackgroundColor !== "transparent" ? `background-color: ${activeBackgroundColor};` : "")}`)}>`;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <!--[-->`;
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let circle = each_array[i];
      $$payload2.out += `<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">`;
      TextCircle($$payload2, {
        text: circle.text,
        fontSize,
        radius: getRadius(i),
        rotationSpeed: circle.rotationSpeed,
        spacingAmplitudePercent: circle.spacingAmplitudePercent,
        spacingSpeed: circle.spacingSpeed,
        rotationStart: circle.rotationStart,
        animationType: circle.animationType,
        containerSize,
        paused: animationPaused,
        textColor: activeTextColor,
        fadeInTime: activeFadeInTime,
        fadeOutTime: activeFadeOutTime,
        pauseTime: activePauseTime,
        visibleTime: activeVisibleTime,
        manualMode: activeManualMode,
        triggerFadeIn: activeTriggerFadeIn,
        triggerFadeOut: activeTriggerFadeOut
      });
      $$payload2.out += `<!----></div>`;
    }
    $$payload2.out += `<!--]--></div></div> <div class="flex-1 min-w-0">`;
    if (showControls || !items && !globalSettings) {
      $$payload2.out += "<!--[-->";
      const each_array_1 = ensure_array_like(circles);
      $$payload2.out += `<div class="rounded-3xl p-4 mb-4 bg-white w-full"><h3 class="m-0 mb-4 text-lg font-bold text-gray-700 pb-2">Main Controls</h3> <div class="flex flex-col gap-4">`;
      Slider($$payload2, {
        label: "Canvas Size",
        min: 10,
        max: 200,
        step: 1,
        unit: "%",
        precision: 0,
        tooltip: `📝 Adjust the size of the canvas (${stringify(Math.round(containerSizePercent / 100 * baseContainerSize))}px)`,
        get value() {
          return containerSizePercent;
        },
        set value($$value) {
          containerSizePercent = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      Slider($$payload2, {
        label: "Font Size",
        min: 2,
        max: 20,
        step: 0.1,
        unit: "%",
        precision: 2,
        tooltip: `📝 Font size (${stringify(Math.round(fontSizePercent / 100 * containerSize))}px)`,
        get value() {
          return fontSizePercent;
        },
        set value($$value) {
          fontSizePercent = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      Slider($$payload2, {
        label: "Distance Between Circles",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "%",
        precision: 2,
        tooltip: `📝 Space between circles (${stringify(Math.round(distancePercent / 100 * containerSize))}px)`,
        get value() {
          return distancePercent;
        },
        set value($$value) {
          distancePercent = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> <div class="flex justify-between items-center p-2 rounded-3xl bg-white"><span>Animation:</span> `;
      Button($$payload2, {
        variant: "primary",
        children: ($$payload3) => {
          $$payload3.out += `<!---->${escape_html("⏸️ Pause")}`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> <div class="flex gap-4 items-end">`;
      Input($$payload2, {
        type: "color",
        label: "Text Color",
        fullWidth: false,
        get value() {
          return textColor;
        },
        set value($$value) {
          textColor = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      Input($$payload2, {
        type: "color",
        label: "Background Color",
        fullWidth: false,
        get value() {
          return backgroundColor;
        },
        set value($$value) {
          backgroundColor = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----></div> `;
      Checkbox($$payload2, {
        label: "Transparent Background",
        get checked() {
          return transparentBackground;
        },
        set checked($$value) {
          transparentBackground = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----></div></div> <div class="bg-white rounded-3xl p-4 mb-4 w-full"><h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Fade Animation</h3> <div class="flex flex-col gap-4">`;
      Checkbox($$payload2, {
        label: "Manual Mode",
        tooltip: "📝 Disable automatic fade cycles",
        get checked() {
          return manualMode;
        },
        set checked($$value) {
          manualMode = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      if (manualMode) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<div class="flex gap-2">`;
        Button($$payload2, {
          variant: "fade",
          children: ($$payload3) => {
            $$payload3.out += `<!---->Fade In`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----> `;
        Button($$payload2, {
          variant: "fade",
          children: ($$payload3) => {
            $$payload3.out += `<!---->Fade Out`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----></div>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> `;
      Slider($$payload2, {
        label: "Fade In Time",
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
        precision: 1,
        get value() {
          return fadeInTime;
        },
        set value($$value) {
          fadeInTime = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      Slider($$payload2, {
        label: "Fade Out Time",
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
        precision: 1,
        get value() {
          return fadeOutTime;
        },
        set value($$value) {
          fadeOutTime = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      if (!manualMode) {
        $$payload2.out += "<!--[-->";
        Slider($$payload2, {
          label: "Visible Time",
          min: 1,
          max: 15,
          step: 0.1,
          unit: "s",
          precision: 1,
          get value() {
            return visibleTime;
          },
          set value($$value) {
            visibleTime = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        Slider($$payload2, {
          label: "Pause Time",
          min: 0.5,
          max: 10,
          step: 0.1,
          unit: "s",
          precision: 1,
          get value() {
            return pauseTime;
          },
          set value($$value) {
            pauseTime = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!---->`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div></div> <div class="bg-white rounded-3xl p-4 mb-4 w-full"><h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Export &amp; Recording</h3> <div class="flex flex-col gap-4">`;
      Input($$payload2, {
        type: "number",
        label: "Export Resolution",
        min: 720,
        max: 3840,
        step: 1,
        tooltip: "📝 Resolution in pixels (square format)",
        get value() {
          return exportResolution;
        },
        set value($$value) {
          exportResolution = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> `;
      Checkbox($$payload2, {
        label: "High-Resolution Recording",
        tooltip: "📝 Uses higher quality rendering but may be slower",
        get checked() {
          return useHighResRecording;
        },
        set checked($$value) {
          useHighResRecording = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----> <div class="flex gap-2 flex-wrap">`;
      Button($$payload2, {
        variant: "primary",
        children: ($$payload3) => {
          $$payload3.out += `<!---->Save PNG`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----> `;
      Button($$payload2, {
        variant: "record",
        recording: isRecording,
        children: ($$payload3) => {
          {
            $$payload3.out += "<!--[-->";
            $$payload3.out += `<div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> Record Video`;
          }
          $$payload3.out += `<!--]-->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> `;
      RecordingIndicator($$payload2, { isRecording, elapsedTime, size: "md" });
      $$payload2.out += `<!----></div></div> <div class="bg-white rounded-3xl p-4 mb-4 w-full"><h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Background Media</h3> <div class="flex flex-col gap-4">`;
      FileUpload($$payload2, {
        label: "Background Image/Video",
        description: "Add a background image or video to your animation",
        maxSize: 50,
        currentFile: currentBackgroundFile
      });
      $$payload2.out += `<!----> `;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div></div> <div class="flex justify-center my-4">`;
      Button($$payload2, {
        rounded: true,
        children: ($$payload3) => {
          $$payload3.out += `<!---->+`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> <!--[-->`;
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let circle = each_array_1[i];
        $$payload2.out += `<div class="bg-white rounded-3xl p-4 mb-4 w-full"><h3 class="m-0 mb-4 text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">Circle ${escape_html(i + 1)}: ${escape_html(circle.text)}</h3> <div class="flex flex-col gap-4">`;
        Input($$payload2, {
          type: "text",
          label: "Text",
          placeholder: "Enter circle text",
          get value() {
            return circle.text;
          },
          set value($$value) {
            circle.text = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        Slider($$payload2, {
          label: "Rotation Speed",
          min: -2,
          max: 2,
          step: 0.01,
          precision: 2,
          get value() {
            return circle.rotationSpeed;
          },
          set value($$value) {
            circle.rotationSpeed = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        Slider($$payload2, {
          label: "Rotation Start",
          min: 0,
          max: 360,
          step: 1,
          unit: "°",
          precision: 0,
          get value() {
            return circle.rotationStart;
          },
          set value($$value) {
            circle.rotationStart = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        Slider($$payload2, {
          label: "Letter Spacing Amplitude",
          min: 0,
          max: 10,
          step: 0.01,
          unit: "%",
          precision: 2,
          get value() {
            return circle.spacingAmplitudePercent;
          },
          set value($$value) {
            circle.spacingAmplitudePercent = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        Slider($$payload2, {
          label: "Letter Spacing Speed",
          min: 0,
          max: 1,
          step: 0.01,
          unit: " Hz",
          precision: 2,
          get value() {
            return circle.spacingSpeed;
          },
          set value($$value) {
            circle.spacingSpeed = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        Select($$payload2, {
          label: "Animation Type",
          options: animationOptions,
          placeholder: "Choose animation...",
          get value() {
            return circle.animationType;
          },
          set value($$value) {
            circle.animationType = $$value;
            $$settled = false;
          }
        });
        $$payload2.out += `<!----> `;
        if (circles.length > 1) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<div class="mt-4 flex justify-center">`;
          Button($$payload2, {
            variant: "danger",
            size: "sm",
            children: ($$payload3) => {
              $$payload3.out += `<!---->Remove Circle`;
            },
            $$slots: { default: true }
          });
          $$payload2.out += `<!----></div>`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]--></div></div>`;
      }
      $$payload2.out += `<!--]-->`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, { config });
  pop();
}
function ProjectItem($$payload, $$props) {
  push();
  let projectData, projectTitle, projectClient, aspectClass, config, projectUid;
  let project = $$props["project"];
  let dimension = fallback($$props["dimension"], "landscape");
  let clickable = fallback($$props["clickable"], true);
  let isHovering = false;
  projectData = project.data || project;
  projectTitle = projectData?.title || "Untitled Project";
  projectClient = projectData?.client || "Untitled Client";
  aspectClass = {
    landscape: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]"
  }[dimension];
  config = {
    uiVisible: false,
    globalSettings: {
      containerSizePercent: 60,
      fontSizePercent: 8,
      distancePercent: 1,
      paused: false,
      textColor: "#ffffff",
      backgroundColor: "#ffffff",
      transparentBackground: true,
      saveStillTrigger: false,
      startRecording: false,
      stopRecording: false,
      exportResolution: 400,
      useHighResRecording: false,
      fadeInTime: 0.5,
      fadeOutTime: 0.5,
      pauseTime: 1.5,
      visibleTime: 5,
      manualMode: true,
      triggerFadeIn: isHovering,
      triggerFadeOut: !isHovering
    },
    items: [
      {
        text: projectTitle,
        rotationSpeed: 0.5,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 0,
        animationType: "sin"
      },
      {
        text: projectClient,
        rotationSpeed: 0.3,
        spacingAmplitudePercent: 2,
        spacingSpeed: 0.09,
        rotationStart: 180,
        animationType: "sin"
      }
    ]
  };
  projectUid = project.uid || project.id;
  if (clickable) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<a${attr("href", `/work/${stringify(projectUid)}`)} class="block">`;
    if (projectData?.preview && Array.isArray(projectData.preview) && projectData.preview.length > 0 && projectData.preview[0]) {
      $$payload.out += "<!--[-->";
      const preview = projectData.preview[0];
      const imageField = dimension === "portrait" ? preview?.preview_image_portrait : preview?.preview_image_landscape;
      const videoUrl = dimension === "portrait" ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape;
      if (videoUrl) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="relative">`;
        VideoPreview($$payload, {
          hlsUrl: videoUrl,
          posterImage: imageField,
          classes: `w-full h-auto rounded object-cover ${stringify(aspectClass)}`
        });
        $$payload.out += `<!----> <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay svelte-fycqs5">`;
        BigWheel($$payload, { config });
        $$payload.out += `<!----></div></div>`;
      } else if (imageField?.url) {
        $$payload.out += "<!--[1-->";
        $$payload.out += `<div class="relative">`;
        PrismicImage($$payload, {
          field: imageField,
          class: `w-full h-auto rounded ${stringify(aspectClass)} object-cover`
        });
        $$payload.out += `<!----> <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay svelte-fycqs5">`;
        BigWheel($$payload, { config });
        $$payload.out += `<!----></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></a>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="block">`;
    if (projectData?.preview && Array.isArray(projectData.preview) && projectData.preview.length > 0 && projectData.preview[0]) {
      $$payload.out += "<!--[-->";
      const preview = projectData.preview[0];
      const imageField = dimension === "portrait" ? preview?.preview_image_portrait : preview?.preview_image_landscape;
      const videoUrl = dimension === "portrait" ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape;
      if (videoUrl) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="relative mb-4">`;
        VideoPreview($$payload, {
          hlsUrl: videoUrl,
          posterImage: imageField,
          classes: `w-full h-auto rounded object-cover ${stringify(aspectClass)}`
        });
        $$payload.out += `<!----> <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay svelte-fycqs5">`;
        BigWheel($$payload, { config });
        $$payload.out += `<!----></div></div>`;
      } else if (imageField?.url) {
        $$payload.out += "<!--[1-->";
        $$payload.out += `<div class="relative mb-4">`;
        PrismicImage($$payload, {
          field: imageField,
          class: `w-full h-auto rounded ${stringify(aspectClass)} object-cover`
        });
        $$payload.out += `<!----> <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay svelte-fycqs5">`;
        BigWheel($$payload, { config });
        $$payload.out += `<!----></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { project, dimension, clickable });
  pop();
}
function ProjectIndex($$payload, $$props) {
  push();
  let remainingProjects;
  let allProjects = fallback($$props["allProjects"], () => [], true);
  let featuredProjectIds = fallback($$props["featuredProjectIds"], () => [], true);
  remainingProjects = allProjects.filter((project) => !featuredProjectIds.includes(project.id));
  $$payload.out += `<div>`;
  if (remainingProjects.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(remainingProjects);
    $$payload.out += `<div class="grid grid-cols-3 gap-4"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let project = each_array[$$index];
      ProjectItem($$payload, { dimension: "portrait", project });
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { allProjects, featuredProjectIds });
  pop();
}
function _page($$payload, $$props) {
  push();
  let featuredProjectIds;
  let data = $$props["data"];
  featuredProjectIds = (() => {
    const ids = [];
    if (isFilled.contentRelationship(data.page.data.feature_project)) {
      ids.push(data.page.data.feature_project.id);
    }
    if (data.page.data.feature_projects) {
      data.page.data.feature_projects.forEach((projectGroup) => {
        if (isFilled.contentRelationship(projectGroup.items)) {
          ids.push(projectGroup.items.id);
        }
      });
    }
    return ids;
  })();
  $$payload.out += `<div class="px-4">`;
  if (isFilled.contentRelationship(data.page.data.feature_project)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="pb-4">`;
    ProjectItem($$payload, {
      dimension: "landscape",
      project: data.page.data.feature_project
    });
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (data.page.data.feature_projects && data.page.data.feature_projects.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(data.page.data.feature_projects);
    $$payload.out += `<div class="grid grid-cols-2 gap-4"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let projectGroup = each_array[$$index];
      if (isFilled.contentRelationship(projectGroup.items)) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="pb-4">`;
        ProjectItem($$payload, {
          dimension: "square",
          project: projectGroup.items
        });
        $$payload.out += `<!----></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  ProjectIndex($$payload, {
    allProjects: data.allProjects,
    featuredProjectIds
  });
  $$payload.out += `<!----> `;
  if (data.page.data.slices && data.page.data.slices.length > 0) {
    $$payload.out += "<!--[-->";
    SliceZone($$payload, { slices: data.page.data.slices, components });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
