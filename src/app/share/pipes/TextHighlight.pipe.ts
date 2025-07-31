import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'textHighlight',
  standalone: true
})
export class TextHighlightPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | null | undefined, searchTerm: string): SafeHtml {
    if (!text || !searchTerm || searchTerm.trim() === '') {
      return this.sanitizer.bypassSecurityTrustHtml(text || '');
    }
    
    // Normalize text and search term for Vietnamese characters
    const normalizedText = this.normalizeVietnamese(text);
    const normalizedSearchTerm = this.normalizeVietnamese(searchTerm.trim());
    
    // Escape special regex characters
    const searchTermEscaped = normalizedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex with case-insensitive flag and word boundary
    const regex = new RegExp(`(${searchTermEscaped})`, 'gi');
    
    // Find matches in normalized text
    const matches = normalizedText.match(regex);
    
    if (!matches) {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
    
    // Replace matches with highlighted span
    let highlightedText = text;
    
    // Sort matches by length (longest first) to avoid nested replacements
    const uniqueMatches = [...new Set(matches)].sort((a, b) => b.length - a.length);
    
    uniqueMatches.forEach(match => {
      const matchRegex = new RegExp(`(${this.escapeRegex(match)})`, 'gi');
      highlightedText = highlightedText.replace(matchRegex, 
        '<span class="highlighted-text">$1</span>'
      );
    });
    
    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }

  private normalizeVietnamese(text: string): string {
    return text.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
               .toLowerCase();
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}