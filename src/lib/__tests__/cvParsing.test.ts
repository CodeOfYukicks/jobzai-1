/**
 * Unit tests for CV parsing
 */

import { parseCVData } from '../cvSectionAI';
import { validateParsedCV } from '../cvParsingValidator';

describe('CV Parsing', () => {
  test('should parse multiple experiences correctly', () => {
    const markdown = `
# John Doe
## Professional Experience
### Software Engineer - Company A
2020 - Present
- Did X
- Did Y
### Product Manager - Company B
2018 - 2020
- Did Z
`;
    const parsed = parseCVData({ initial_cv: markdown });
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0].title).toBe('Software Engineer');
    expect(parsed.experience[0].company).toBe('Company A');
    expect(parsed.experience[1].title).toBe('Product Manager');
    expect(parsed.experience[1].company).toBe('Company B');
  });

  test('should parse education entries correctly', () => {
    const markdown = `
# Jane Doe
## Education
### Master's Degree - University Name
2020
GPA: 3.8/4.0
### Bachelor's Degree - Another University
2018
`;
    const parsed = parseCVData({ initial_cv: markdown });
    expect(parsed.education).toHaveLength(2);
    expect(parsed.education[0].degree).toBe("Master's Degree");
    expect(parsed.education[0].institution).toBe('University Name');
    expect(parsed.education[1].degree).toBe("Bachelor's Degree");
  });

  test('should validate parsed CV structure', () => {
    const parsed = {
      experience: [
        {
          id: 'exp-0',
          title: 'Engineer',
          company: 'Company',
          startDate: '2020',
          endDate: 'Present',
          bullets: ['Bullet 1', 'Bullet 2'],
        },
      ],
      education: [
        {
          id: 'edu-0',
          degree: 'Degree',
          institution: 'University',
          year: '2020',
        },
      ],
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    };
    const validation = validateParsedCV(parsed);
    expect(validation.isValid).toBe(true);
    expect(validation.stats.experiencesCount).toBe(1);
    expect(validation.stats.educationsCount).toBe(1);
  });

  test('should detect missing required fields', () => {
    const parsed = {
      experience: [
        {
          id: 'exp-0',
          // Missing title and company
          bullets: [],
        },
      ],
    };
    const validation = validateParsedCV(parsed);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.warnings.some((w) => w.includes('missing title'))).toBe(true);
    expect(validation.warnings.some((w) => w.includes('missing company'))).toBe(true);
  });

  test('should detect experience count mismatch', () => {
    const parsed = {
      experience: [{ title: 'Engineer', company: 'Co' }],
    };
    const extractionSummary = {
      experiences_found: 3,
    };
    const validation = validateParsedCV(parsed, extractionSummary);
    expect(validation.warnings.some((w) => w.includes('Mismatch'))).toBe(true);
  });
});

