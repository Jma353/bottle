import { Field } from '@base-ui/react/field';
import styled from 'styled-components';

export const Panel = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

export const FieldRoot = styled(Field.Root)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

export const FieldLabel = styled(Field.Label)`
  font-size: 14px;
  font-weight: 500;
`;

export const Input = styled.input`
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
`;

export const Button = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #f9fafb;
  }
`;

export const Empty = styled.div`
  font-size: 14px;
  color: #6b7280;
`;
