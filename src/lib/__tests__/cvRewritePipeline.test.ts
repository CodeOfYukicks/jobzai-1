/**
 * Integration tests for CV rewrite pipeline
 */

import { parseCVData } from '../cvSectionAI';
import { validateParsedCV } from '../cvParsingValidator';

describe('CV Rewrite Pipeline', () => {
  test('should preserve all experiences during rewrite', () => {
    // Mock CV with 5 experiences
    const cvText = `
# John Doe
## Professional Experience
### Engineer 1 - Company 1
2020 - Present
- Bullet 1
### Engineer 2 - Company 2
2018 - 2020
- Bullet 2
### Engineer 3 - Company 3
2016 - 2018
- Bullet 3
### Engineer 4 - Company 4
2014 - 2016
- Bullet 4
### Engineer 5 - Company 5
2012 - 2014
- Bullet 5
`;

    const parsed = parseCVData({ initial_cv: cvText });
    expect(parsed.experience.length).toBe(5);

    // Validate that all experiences are present
    const validation = validateParsedCV(parsed);
    expect(validation.isValid).toBe(true);
    expect(validation.stats.experiencesCount).toBe(5);
  });

  test('should handle CV with no experiences gracefully', () => {
    const cvText = `
# John Doe
## Education
### Degree - University
2020
`;

    const parsed = parseCVData({ initial_cv: cvText });
    expect(parsed.experience).toBeDefined();
    expect(Array.isArray(parsed.experience)).toBe(true);
    expect(parsed.experience.length).toBe(0);
  });

  test('should parse dates in various formats', () => {
    const cvText = `
# John Doe
## Professional Experience
### Engineer - Company
Jan 2020 – Present
- Bullet 1
### Manager - Company 2
2020-01 - 2022-12
- Bullet 2
### Developer - Company 3
2020 - 2022
- Bullet 3
`;

    const parsed = parseCVData({ initial_cv: cvText });
    expect(parsed.experience.length).toBe(3);
    // All experiences should have dates parsed
    parsed.experience.forEach((exp) => {
      expect(exp.startDate).toBeTruthy();
    });
  });
});

