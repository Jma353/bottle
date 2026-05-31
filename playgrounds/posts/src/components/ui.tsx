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
