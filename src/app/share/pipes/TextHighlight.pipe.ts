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

    const cleanSearchTerm = searchTerm.trim();

    // Tạo regex để tìm kiếm không phân biệt hoa thường và có dấu
    const searchRegex = this.createVietnameseSearchRegex(cleanSearchTerm);

    if (!searchRegex) {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    // Tìm tất cả matches trong text gốc
    const matches = text.match(searchRegex);

    if (!matches || matches.length === 0) {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    // Highlight các matches
    let highlightedText = text;

    // Sắp xếp matches theo độ dài giảm dần để tránh conflict
    const uniqueMatches = [...new Set(matches)].sort((a, b) => b.length - a.length);

    uniqueMatches.forEach(match => {
      const escapedMatch = this.escapeRegex(match);
      const replaceRegex = new RegExp(`(${escapedMatch})`, 'gi');
      highlightedText = highlightedText.replace(replaceRegex,
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

  private createVietnameseSearchRegex(searchTerm: string): RegExp | null {
    if (!searchTerm) return null;

    // Tạo pattern có thể match cả có dấu và không dấu
    let pattern = '';

    for (let i = 0; i < searchTerm.length; i++) {
      const char = searchTerm[i];
      const normalizedChar = this.normalizeVietnamese(char);

      // Nếu là ký tự tiếng Việt, tạo character class cho cả có dấu và không dấu
      if (this.isVietnameseChar(char)) {
        const variations = this.getVietnameseCharVariations(normalizedChar);
        pattern += `[${variations}]`;
      } else {
        // Escape special regex characters
        pattern += this.escapeRegex(char);
      }
    }

    try {
      return new RegExp(pattern, 'gi');
    } catch (e) {
      console.warn('Invalid regex pattern:', pattern, e);
      return null;
    }
  }

  private isVietnameseChar(char: string): boolean {
    const vietnameseChars = /[aàáạảãâầấậẩẫăằắặẳẵeèéẹẻẽêềếệểễiìíịỉĩoòóọỏõôồốộổỗơờớợởỡuùúụủũưừứựửữyỳýỵỷỹđAÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴEÈÉẸẺẼÊỀẾỆỂỄIÌÍỊỈĨOÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠUÙÚỤỦŨƯỪỨỰỬỮYỲÝỴỶỸĐ]/;
    return vietnameseChars.test(char);
  }

  private getVietnameseCharVariations(normalizedChar: string): string {
    const variations: { [key: string]: string } = {
      'a': 'aàáạảãâầấậẩẫăằắặẳẵAÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ',
      'e': 'eèéẹẻẽêềếệểễEÈÉẸẺẼÊỀẾỆỂỄ',
      'i': 'iìíịỉĩIÌÍỊỈĨ',
      'o': 'oòóọỏõôồốộổỗơờớợởỡOÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ',
      'u': 'uùúụủũưừứựửữUÙÚỤỦŨƯỪỨỰỬỮ',
      'y': 'yỳýỵỷỹYỲÝỴỶỸ',
      'd': 'dđDĐ'
    };

    return variations[normalizedChar] || normalizedChar;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
