import styled from 'styled-components';

import { Empty, Panel } from './ui';

type Props = {
  title: string;
  entries: string[];
};

export function ChangeLog(props: Props) {
  const { title, entries } = props;

  return (
    <Panel>
      <Title>{title}</Title>
      {entries.length === 0 ? (
        <Empty>No changes yet.</Empty>
      ) : (
        <List>
          {entries.map((entry, i) => (
            <Entry key={i}>{entry}</Entry>
          ))}
        </List>
      )}
    </Panel>
  );
}

const Title = styled.h3`
  margin: 0 0 var(--space-5);
  font-size: var(--font-size-lg);
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 200px;
  overflow-y: auto;
`;

const Entry = styled.div`
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  color: var(--color-gray-700);
  padding: var(--space-1) var(--space-3);
  background: var(--color-gray-50);
  border-radius: var(--radius-sm);
`;
