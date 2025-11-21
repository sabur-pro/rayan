/**
 * Quill Delta to HTML converter
 * Converts Quill Delta format (ops array) to HTML string
 */

/**
 * Adapt text colors for theme visibility
 * Replaces problematic colors (white text in light mode, black text in dark mode)
 */
const adaptColorForTheme = (color: string | undefined, isDarkTheme: boolean, isBackground: boolean = false): string | undefined => {
  if (!color) return undefined;
  
  const normalizedColor = color.toLowerCase().replace(/\s/g, '');
  
  // List of light colors that are hard to read on light backgrounds
  const lightColors = [
    '#fff', '#ffffff', 'white',
    '#fefefe', '#fdfdfd', '#fcfcfc', '#fbfbfb', '#fafafa',
    '#f9f9f9', '#f8f8f8', '#f7f7f7', '#f6f6f6', '#f5f5f5',
    '#f4f4f4', '#f3f3f3', '#f2f2f2', '#f1f1f1', '#f0f0f0',
    '#efefef', '#eeeeee', '#ededed', '#ececec', '#ebebeb',
    '#eaeaea', '#e9e9e9', '#e8e8e8', '#e7e7e7', '#e6e6e6',
    '#e5e5e5', '#e4e4e4', '#e3e3e3', '#e2e2e2', '#e1e1e1',
    '#e0e0e0', '#dfdfdf', '#dedede', '#dddddd', '#dcdcdc',
  ];
  
  // List of dark colors that are hard to read on dark backgrounds
  const darkColors = [
    '#000', '#000000', 'black',
    '#010101', '#020202', '#030303', '#040404', '#050505',
    '#060606', '#070707', '#080808', '#090909', '#0a0a0a',
    '#0b0b0b', '#0c0c0c', '#0d0d0d', '#0e0e0e', '#0f0f0f',
    '#101010', '#111111', '#121212', '#131313', '#141414',
    '#151515', '#161616', '#171717', '#181818', '#191919',
    '#1a1a1a', '#1b1b1b', '#1c1c1c', '#1d1d1d', '#1e1e1e',
    '#1f1f1f', '#202020', '#212121', '#222222', '#232323',
  ];
  
  // For background colors - different logic
  if (isBackground) {
    // In light theme, replace white/very light backgrounds with a visible tint
    if (!isDarkTheme && lightColors.includes(normalizedColor)) {
      return '#fff9c4'; // Light yellow tint for highlighting
    }
    
    // In dark theme, replace black/very dark backgrounds with a visible tint
    if (isDarkTheme && darkColors.includes(normalizedColor)) {
      return '#4a4a2a'; // Dark yellow-ish tint for highlighting
    }
    
    // Check RGB/RGBA background colors
    const rgbMatch = normalizedColor.match(/rgba?\((\d+),?(\d+),?(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // For very light backgrounds in light theme
      if (!isDarkTheme && brightness > 240) {
        return '#fff9c4'; // Light yellow highlight
      }
      
      // For very dark backgrounds in dark theme
      if (isDarkTheme && brightness < 20) {
        return '#4a4a2a'; // Dark yellow highlight
      }
      
      // For somewhat light backgrounds in dark theme - darken them
      if (isDarkTheme && brightness > 180) {
        // Darken the color for dark theme
        const factor = 0.3;
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
      }
    }
    
    return color;
  }
  
  // For text colors - original logic
  // In light theme, replace light colors with dark
  if (!isDarkTheme && lightColors.includes(normalizedColor)) {
    return '#1a1a1a'; // Dark gray/black for light theme
  }
  
  // In dark theme, replace dark colors with light
  if (isDarkTheme && darkColors.includes(normalizedColor)) {
    return '#f5f5f5'; // Light gray/white for dark theme
  }
  
  // Check RGB/RGBA colors
  const rgbMatch = normalizedColor.match(/rgba?\((\d+),?(\d+),?(\d+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // If color is too bright for light theme
    if (!isDarkTheme && brightness > 220) {
      return '#1a1a1a';
    }
    
    // If color is too dark for dark theme
    if (isDarkTheme && brightness < 35) {
      return '#f5f5f5';
    }
  }
  
  return color;
};

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
const splitIntoLines = (ops: QuillOp[], isDarkTheme: boolean = false): Line[] => {
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
        currentLine += applyInlineStyles(parts[i], op.attributes || {}, isDarkTheme);
      }
    }
  }
  
  // Add any remaining content
  if (currentLine) {
    lines.push({ content: currentLine, blockAttrs: {} });
  }
  
  return lines;
};

export const quillDeltaToHtml = (delta: QuillDelta, isDarkTheme: boolean = false): string => {
  if (!delta || !delta.ops || !Array.isArray(delta.ops)) {
    return '';
  }

  const lines = splitIntoLines(delta.ops, isDarkTheme);
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

const applyInlineStyles = (text: string, attrs: QuillOp['attributes'] = {}, isDarkTheme: boolean = false): string => {
  let result = escapeHtml(text);
  
  let styles: string[] = [];
  
  // Adapt colors for theme
  const adaptedColor = adaptColorForTheme(attrs.color, isDarkTheme, false);
  const adaptedBackground = adaptColorForTheme(attrs.background, isDarkTheme, true);
  
  if (adaptedColor) {
    styles.push(`color: ${adaptedColor}`);
  }
  if (adaptedBackground) {
    styles.push(`background-color: ${adaptedBackground}`);
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
