import styled from 'styled-components';

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

const Panel = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const Title = styled.h3`
  margin: 0 0 12px;
  font-size: 16px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
`;

const Entry = styled.div`
  font-size: 13px;
  font-family: ui-monospace, monospace;
  color: #374151;
  padding: 4px 8px;
  background: #f9fafb;
  border-radius: 4px;
`;

const Empty = styled.div`
  font-size: 14px;
  color: #6b7280;
`;
