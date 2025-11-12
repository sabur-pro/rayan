/**
 * Quill Delta to HTML converter
 * Converts Quill Delta format (ops array) to HTML string
 */

export interface QuillOp {
  insert: string | { image?: string; video?: string };
  attributes?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;
    background?: string;
    header?: number;
    'code-block'?: boolean;
    blockquote?: boolean;
    list?: 'ordered' | 'bullet';
    align?: 'center' | 'right' | 'justify' | '';
    link?: string;
  };
}

export interface QuillDelta {
  ops: QuillOp[];
}

interface Line {
  content: string;
  blockAttrs: QuillOp['attributes'] | undefined;
}

// Split delta into lines
const splitIntoLines = (ops: QuillOp[]): Line[] => {
  const lines: Line[] = [];
  let currentLine = '';
  
  for (const op of ops) {
    if (typeof op.insert === 'object') {
      // Embed - treat as separate line
      if (currentLine) {
        lines.push({ content: currentLine, blockAttrs: {} });
        currentLine = '';
      }
      if (op.insert.image) {
        lines.push({ 
          content: `<img src="${op.insert.image}" />`, 
          blockAttrs: {} 
        });
      } else if (op.insert.video) {
        lines.push({ 
          content: `<iframe src="${op.insert.video}" frameborder="0" allowfullscreen></iframe>`, 
          blockAttrs: {} 
        });
      }
      continue;
    }
    
    const text = op.insert as string;
    const parts = text.split('\n');
    
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        // We hit a newline - save current line with block attrs from the newline
        lines.push({ 
          content: currentLine, 
          blockAttrs: op.attributes || {} 
        });
        currentLine = '';
      }
      
      if (parts[i]) {
        // Apply inline styles to this part
        currentLine += applyInlineStyles(parts[i], op.attributes || {});
      }
    }
  }
  
  // Add any remaining content
  if (currentLine) {
    lines.push({ content: currentLine, blockAttrs: {} });
  }
  
  return lines;
};

export const quillDeltaToHtml = (delta: QuillDelta): string => {
  if (!delta || !delta.ops || !Array.isArray(delta.ops)) {
    return '';
  }

  const lines = splitIntoLines(delta.ops);
  let html = '';
  let currentList: 'ordered' | 'bullet' | null = null;
  let currentCodeBlock: string[] = [];

  const closeList = () => {
    if (currentList === 'ordered') {
      html += '</ol>';
    } else if (currentList === 'bullet') {
      html += '</ul>';
    }
    currentList = null;
  };

  const flushCodeBlock = () => {
    if (currentCodeBlock.length > 0) {
      const code = currentCodeBlock.join('\n');
      html += `<pre><code>${escapeHtml(code)}</code></pre>`;
      currentCodeBlock = [];
    }
  };

  for (const line of lines) {
    const { content, blockAttrs } = line;
    
    // Code block
    if (blockAttrs?.['code-block']) {
      if (currentList) closeList();
      // Extract plain text (remove HTML tags)
      const plainText = content.replace(/<[^>]*>/g, '');
      currentCodeBlock.push(plainText);
      continue;
    }
    
    // Flush any pending code block
    flushCodeBlock();
    
    // List item
    if (blockAttrs?.list) {
      if (currentList !== blockAttrs.list) {
        closeList();
        currentList = blockAttrs.list;
        html += currentList === 'ordered' ? '<ol>' : '<ul>';
      }
      const alignStyle = blockAttrs?.align ? ` style="text-align: ${blockAttrs.align};"` : '';
      html += `<li${alignStyle}>${content || '<br/>'}</li>`;
      continue;
    }
    
    // Close list if we're not in a list anymore
    if (currentList) closeList();
    
    // Blockquote
    if (blockAttrs?.blockquote) {
      html += `<blockquote>${content || '<br/>'}</blockquote>`;
      continue;
    }
    
    // Header
    if (blockAttrs?.header) {
      const alignStyle = blockAttrs?.align ? ` style="text-align: ${blockAttrs.align};"` : '';
      html += `<h${blockAttrs.header}${alignStyle}>${content || '<br/>'}</h${blockAttrs.header}>`;
      continue;
    }
    
    // Regular paragraph or embed
    if (content.startsWith('<img') || content.startsWith('<iframe')) {
      // Embed content
      html += content;
    } else if (content.trim()) {
      const alignStyle = blockAttrs?.align ? ` style="text-align: ${blockAttrs.align};"` : '';
      html += `<p${alignStyle}>${content}</p>`;
    } else {
      html += '<br/>';
    }
  }

  // Flush any remaining content
  flushCodeBlock();
  closeList();

  return html;
};

const applyInlineStyles = (text: string, attrs: QuillOp['attributes'] = {}): string => {
  let result = escapeHtml(text);
  
  let styles: string[] = [];
  
  if (attrs.color) {
    styles.push(`color: ${attrs.color}`);
  }
  if (attrs.background) {
    styles.push(`background-color: ${attrs.background}`);
  }
  
  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
  
  if (attrs.link) {
    result = `<a href="${attrs.link}"${styleAttr}>${result}</a>`;
  } else if (styleAttr) {
    result = `<span${styleAttr}>${result}</span>`;
  }
  
  if (attrs.bold) {
    result = `<strong>${result}</strong>`;
  }
  if (attrs.italic) {
    result = `<em>${result}</em>`;
  }
  if (attrs.underline) {
    result = `<u>${result}</u>`;
  }
  if (attrs.strike) {
    result = `<del>${result}</del>`;
  }
  
  return result;
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
