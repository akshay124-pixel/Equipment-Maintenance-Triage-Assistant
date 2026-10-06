import {
  sanitizeString,
  sanitizeFilename,
  sanitizeEmail,
  containsSQLInjection,
  safeJSONParse,
} from '@/lib/utils/sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    test('should remove potential XSS vectors', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    test('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    test('should handle normal strings', () => {
      expect(sanitizeString('Normal text')).toBe('Normal text');
    });
  });

  describe('sanitizeFilename', () => {
    test('should prevent directory traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('_._._.etc_passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('_.__._windows_system32');
    });

    test('should allow safe characters', () => {
      expect(sanitizeFilename('my-file_123.pdf')).toBe('my-file_123.pdf');
    });

    test('should replace unsafe characters', () => {
      expect(sanitizeFilename('file name with spaces.pdf')).toBe('file_name_with_spaces.pdf');
      expect(sanitizeFilename('file@#$%.txt')).toBe('file____.txt');
    });

    test('should limit length', () => {
      const longName = 'a'.repeat(300);
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });
  });

  describe('sanitizeEmail', () => {
    test('should convert to lowercase', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    test('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });
  });

  describe('containsSQLInjection', () => {
    test('should detect SQL keywords', () => {
      expect(containsSQLInjection('SELECT * FROM users')).toBe(true);
      expect(containsSQLInjection('DROP TABLE users')).toBe(true);
      expect(containsSQLInjection('INSERT INTO users')).toBe(true);
    });

    test('should detect SQL comment patterns', () => {
      expect(containsSQLInjection('admin\'--')).toBe(true);
      expect(containsSQLInjection('admin\' /*')).toBe(true);
    });

    test('should detect OR/AND injection patterns', () => {
      expect(containsSQLInjection('1\' OR \'1\'=\'1')).toBe(true);
      expect(containsSQLInjection('admin\' AND 1=1')).toBe(true);
    });

    test('should allow normal text', () => {
      expect(containsSQLInjection('Normal user input')).toBe(false);
      expect(containsSQLInjection('user@example.com')).toBe(false);
    });
  });

  describe('safeJSONParse', () => {
    test('should parse valid JSON', () => {
      const result = safeJSONParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    test('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJSONParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });

    test('should handle arrays', () => {
      const result = safeJSONParse('[1, 2, 3]', []);
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
