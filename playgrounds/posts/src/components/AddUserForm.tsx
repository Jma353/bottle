import { Button } from '@base-ui/react/button';
import styled from 'styled-components';

import { FieldLabel, FieldRoot, Input } from './ui';

type Props = {
  name: string;
  age: string;
  onNameChange: (name: string) => void;
  onAgeChange: (age: string) => void;
  onAdd: () => void;
};

export function AddUserForm(props: Props) {
  const { name, age, onNameChange, onAgeChange, onAdd } = props;

  return (
    <>
      <FieldRoot>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Joe"
        />
      </FieldRoot>
      <FieldRoot>
        <FieldLabel>Age</FieldLabel>
        <Input
          value={age}
          onChange={e => onAgeChange(e.target.value)}
          placeholder="30"
          type="number"
        />
      </FieldRoot>
      <StyledButton onClick={onAdd}>Add user</StyledButton>
    </>
  );
}

const StyledButton = styled(Button)`
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
