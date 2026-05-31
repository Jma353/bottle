import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { store, type Post, type User } from '../store';
import { AuthorSelect } from './AuthorSelect';
import { Button, Empty, Input } from './ui';

type Props = {
  users: readonly User[];
  posts: readonly Post[];
  editingUserId: string | null;
  editName: string;
  editAge: string;
  onStartEditUser: (user: User) => void;
  onEditNameChange: (name: string) => void;
  onEditAgeChange: (age: string) => void;
  onSaveUserEdit: () => void;
  onCancelUserEdit: () => void;
  editingPostId: string | null;
  editPostTitle: string;
  editPostAuthorId: string;
  onStartEditPost: (post: Post) => void;
  onEditPostTitleChange: (title: string) => void;
  onEditPostAuthorIdChange: (authorId: string) => void;
  onSavePostEdit: () => void;
  onCancelPostEdit: () => void;
  onDeletePost: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onCommitPost: (id: string) => void;
  onRollbackPost: (id: string) => void;
};

function UsersWithPostsInner(props: Props) {
  const {
    users,
    posts,
    editingUserId,
    editName,
    editAge,
    onStartEditUser,
    onEditNameChange,
    onEditAgeChange,
    onSaveUserEdit,
    onCancelUserEdit,
    editingPostId,
    editPostTitle,
    editPostAuthorId,
    onStartEditPost,
    onEditPostTitleChange,
    onEditPostAuthorIdChange,
    onSavePostEdit,
    onCancelPostEdit,
    onDeletePost,
    onDeleteUser,
    onCommitPost,
    onRollbackPost,
  } = props;

  function getAuthorName(authorId: string): string {
    const user = users.find(u => u.id === authorId);
    return user?.name ?? authorId;
  }

  function getChangedFields(
    post: Post
  ): { label: string; oldValue?: string; newValue: string }[] {
    const snap = store.posts.snapshot(post.id);
    const original = snap.original as Post | undefined;

    if (!original) {
      return [
        { label: 'Title', newValue: post.title },
        { label: 'Author', newValue: getAuthorName(post.authorId) },
      ];
    }

    const fields: { label: string; oldValue?: string; newValue: string }[] =
      [];
    if (original.title !== post.title) {
      fields.push({
        label: 'Title',
        oldValue: original.title,
        newValue: post.title,
      });
    }
    if (original.authorId !== post.authorId) {
      fields.push({
        label: 'Author',
        oldValue: getAuthorName(original.authorId),
        newValue: getAuthorName(post.authorId),
      });
    }
    return fields;
  }

  return (
    <>
      {users.length === 0 ? (
        <Empty>No users yet.</Empty>
      ) : null}
      {users.map(user => {
        const userPosts: Post[] = [];
        for (const p of posts) {
          if (p.authorId === user.id) {
            userPosts.push(p);
          }
        }
        const isEditingUser = editingUserId === user.id;

        return (
          <UserEntry key={user.id}>
            {isEditingUser ? (
              <>
                <EditRow>
                  <Input
                    value={editName}
                    onChange={e => onEditNameChange(e.target.value)}
                    placeholder="Name"
                    style={{ width: '120px' }}
                  />
                  <Input
                    value={editAge}
                    onChange={e => onEditAgeChange(e.target.value)}
                    placeholder="Age"
                    type="number"
                    style={{ width: '120px' }}
                  />
                </EditRow>
                <EditRow>
                  <Button onClick={onSaveUserEdit}>Save</Button>
                  <Button onClick={onCancelUserEdit}>Cancel</Button>
                </EditRow>
              </>
            ) : (
              <UserHeader>
                <UserName>
                  {user.name} (age {user.age})
                </UserName>
                <ButtonGroup>
                  <Button onClick={() => onStartEditUser(user)}>Edit</Button>
                  <Button onClick={() => onDeleteUser(user.id)}>Delete</Button>
                </ButtonGroup>
              </UserHeader>
            )}
            {userPosts.length > 0 ? (
              <PostsGrid>
                {userPosts.map(post => {
                  const isEditingPost = editingPostId === post.id;
                  const isDraft = store.posts.snapshot(post.id).isDraft;

                  return (
                    <PostCard key={post.id}>
                      {isEditingPost && !isDraft ? (
                        <>
                          <EditRow>
                            <Input
                              value={editPostTitle}
                              onChange={e =>
                                onEditPostTitleChange(e.target.value)
                              }
                              placeholder="Title"
                              style={{ width: '120px' }}
                            />
                            <div style={{ width: '120px' }}>
                              <AuthorSelect
                                users={users}
                                value={editPostAuthorId || null}
                                onChange={onEditPostAuthorIdChange}
                              />
                            </div>
                          </EditRow>
                          <EditRow>
                            <Button onClick={onSavePostEdit}>Save</Button>
                            <Button onClick={onCancelPostEdit}>Cancel</Button>
                          </EditRow>
                        </>
                      ) : isDraft ? (
                        <>
                          <PostCardHeader>
                            <PostTitle>{post.title}</PostTitle>
                            <DraftBadge>Draft</DraftBadge>
                          </PostCardHeader>
                          <PostMeta>
                            Author: {getAuthorName(post.authorId)}
                          </PostMeta>
                          <ChangedFields>
                            <ChangedFieldsTitle>
                              {store.posts.snapshot(post.id).original
                                ? 'Changes'
                                : 'New post'}
                            </ChangedFieldsTitle>
                            {getChangedFields(post).map(field => (
                              <ChangedFieldItem key={field.label}>
                                <strong>{field.label}:</strong>{' '}
                                {field.oldValue !== undefined ? (
                                  <>
                                    <span
                                      style={{
                                        textDecoration: 'line-through',
                                        color: '#9ca3af',
                                      }}
                                    >
                                      {field.oldValue}
                                    </span>{' '}
                                    → {field.newValue}
                                  </>
                                ) : (
                                  field.newValue
                                )}
                              </ChangedFieldItem>
                            ))}
                          </ChangedFields>
                          <EditRow>
                            <Button onClick={() => onCommitPost(post.id)}>
                              Save Draft
                            </Button>
                            <Button onClick={() => onRollbackPost(post.id)}>
                              Cancel
                            </Button>
                          </EditRow>
                        </>
                      ) : (
                        <>
                          <PostCardHeader>
                            <PostTitle>{post.title}</PostTitle>
                            <ButtonGroup>
                              <Button
                                onClick={() => onStartEditPost(post)}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => onDeletePost(post.id)}
                              >
                                Delete
                              </Button>
                            </ButtonGroup>
                          </PostCardHeader>
                          <PostMeta>
                            Author: {getAuthorName(post.authorId)}
                          </PostMeta>
                        </>
                      )}
                    </PostCard>
                  );
                })}
              </PostsGrid>
            ) : null}
          </UserEntry>
        );
      })}
    </>
  );
}

export const UsersWithPosts = observer(UsersWithPostsInner);

const UserEntry = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 15px;
`;

const EditRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const PostsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding-left: 8px;
`;

const PostCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PostCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const PostTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #111827;
`;

const PostMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const DraftBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 500;
`;

const ChangedFields = styled.div`
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
`;

const ChangedFieldsTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  color: #374151;
`;

const ChangedFieldItem = styled.div`
  color: #4b5563;
  line-height: 1.5;
`;
