import { marked } from 'marked';

export function formatMarkdownWithLatex(text: string): string {
    if (!text) return '';

    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    let processedText = text;
    const mathReplacements: Array<{ placeholder: string; element: string }> = [];

    // Process display math
    let displayMathCounter = 0;
    processedText = processedText.replace(/\$\$([^$]*?)\$\$/g, (match, mathContent) => {
        const placeholder = `DISPLAYMATH${displayMathCounter++}PLACEHOLDER`;
        const element = `<div class="display-math" data-math="${encodeURIComponent(mathContent.trim())}"></div>`;
        mathReplacements.push({ placeholder, element });
        return placeholder;
    });

    // Process inline math
    let inlineMathCounter = 0;
    processedText = processedText.replace(/\$([^$\n]*?)\$/g, (match, mathContent) => {
        // Skip if the content is empty or just whitespace
        if (!mathContent.trim()) return match;

        const placeholder = `INLINEMATH${inlineMathCounter++}PLACEHOLDER`;
        const element = `<span class="inline-math" data-math="${encodeURIComponent(mathContent.trim())}"></span>`;
        mathReplacements.push({ placeholder, element });
        return placeholder;
    });

    // Process the markdown
    let htmlContent: string;
    try {
        htmlContent = marked(processedText) as string;
    } catch (error) {
        console.error('Error parsing Markdown:', error);
        // Fallback content with line breaks
        htmlContent = processedText.replace(/\n/g, '<br>');
    }

    // Restore all math expressions
    mathReplacements.forEach(({ placeholder, element }) => {
        htmlContent = htmlContent.replace(new RegExp(`<p>${placeholder}</p>`, 'g'), element);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), element);
    });

    return htmlContent;
}
