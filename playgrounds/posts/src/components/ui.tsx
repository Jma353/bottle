import { Field } from '@base-ui/react/field';
import styled from 'styled-components';

export const Panel = styled.div`
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
`;

export const FieldRoot = styled(Field.Root)`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
`;

export const FieldLabel = styled(Field.Label)`
  font-size: var(--font-size-base);
  font-weight: 500;
`;

export const Input = styled.input`
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
`;

export const Button = styled.button`
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  cursor: pointer;
  font-size: var(--font-size-base);

  &:hover {
    background: var(--color-gray-50);
  }
`;

export const Empty = styled.div`
  font-size: var(--font-size-base);
  color: var(--color-gray-500);
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background: var(--color-white);
  cursor: pointer;
  color: var(--color-gray-600);
  padding: 0;

  &:hover {
    background: var(--color-gray-50);
    color: var(--color-gray-900);
  }
`;

export function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
