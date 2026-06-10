export function writeTextareaValueAndSelect(textarea, value) {
  if (!textarea) {
    return false;
  }
  textarea.value = value ?? "";
  textarea.focus();
  textarea.select();
  return true;
}

export async function copyTextareaValue(textarea, { clipboard = null, documentRef = null } = {}) {
  if (!textarea) {
    return false;
  }

  const targetClipboard = clipboard ?? globalThis.navigator?.clipboard ?? null;
  const targetDocument = documentRef ?? globalThis.document ?? null;
  let clipboardError = null;
  try {
    if (targetClipboard?.writeText) {
      await targetClipboard.writeText(textarea.value);
      return true;
    }
  } catch (error) {
    clipboardError = error;
  }

  try {
    copyTextareaWithExecCommand(textarea, targetDocument);
    return true;
  } catch (fallbackError) {
    const error = new Error("Failed to copy textarea value.");
    error.clipboardError = clipboardError;
    error.fallbackError = fallbackError;
    throw error;
  }
}

export function clearTextInputValue(input) {
  if (input) {
    input.value = "";
  }
}

export function setTextInputValueIfEmpty(input, value) {
  if (input && !input.value.trim()) {
    input.value = value ?? "";
  }
}

function copyTextareaWithExecCommand(textarea, documentRef) {
  if (!documentRef?.execCommand) {
    throw new Error("Missing document.execCommand.");
  }
  textarea.focus();
  textarea.select();
  const copied = documentRef.execCommand("copy");
  textarea.setSelectionRange(0, 0);
  if (!copied) {
    throw new Error("document.execCommand('copy') returned false.");
  }
}
