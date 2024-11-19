export type MergeFieldKey = 'salutation' | 'firstName' | 'lastName' | 'company' | 'position';

export interface MergeField {
  label: string;
  value: string;
  example: string;
}

export const MERGE_FIELDS: Record<MergeFieldKey, MergeField> = {
  salutation: {
    label: 'Salutation',
    value: '{{salutation}}',
    example: 'Mr/Ms'
  },
  firstName: {
    label: 'First Name',
    value: '{{firstName}}',
    example: 'John'
  },
  lastName: {
    label: 'Last Name',
    value: '{{lastName}}',
    example: 'Doe'
  },
  company: {
    label: 'Company',
    value: '{{company}}',
    example: 'Acme Corp'
  },
  position: {
    label: 'Position',
    value: '{{position}}',
    example: 'Software Engineer'
  }
} as const; 