import { Button } from '@base-ui/react/button';
import { Field } from '@base-ui/react/field';
import styled from 'styled-components';

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

const FieldRoot = styled(Field.Root)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

const FieldLabel = styled(Field.Label)`
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
`;

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
