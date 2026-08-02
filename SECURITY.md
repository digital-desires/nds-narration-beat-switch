# Security and privacy

## Data sent to model providers

For each enabled generation, NDS: Narration Beat Switch sends a short classifier request through OpenRouter. It includes the current user message, the previous user/assistant round, the classifier instructions, and the active template's label/trigger index. OpenRouter and the selected model provider can process that content.

The selected capsule is then placed in the normal SillyTavern prompt and reaches the backend configured for the main narration.

The extension does not include telemetry. Debug mode can write classifier context to the local browser console.

## Credentials

API keys are read from SillyTavern extension settings. They are not stored in source files, factory templates, or release archives. Never include an exported settings profile or local editor configuration when sharing the extension.

## Templates and optional server plugin

Imported templates are plain text, but their capsule bodies become model instructions. Review templates before importing them.

The optional `narrator-tools-storage` server plugin is not required for normal operation. SillyTavern server plugins are not sandboxed, so inspect and trust that plugin separately before enabling server plugins. NBS restricts its storage filename to a simple slug and uses a fixed internal filename.

## Reporting a problem

Use GitHub's private vulnerability-reporting feature for security-sensitive issues when available. Do not post API keys, private chat content, or exploitable details in a public issue. For ordinary bugs, open a normal repository issue with secrets and conversation content removed.
