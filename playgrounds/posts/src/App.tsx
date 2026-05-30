import { type ItemChange } from 'bottle';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { AddPostForm } from './components/AddPostForm';
import { AddUserForm } from './components/AddUserForm';
import { ChangeLog } from './components/ChangeLog';
import { UsersWithPosts } from './components/UsersWithPosts';
import { store, type Post, type User } from './store';

function formatUser(user: User): string {
  return `${user.name} ${user.age}`;
}

function formatPost(post: Post): string {
  return `${post.authorId} "${post.title}"`;
}

function formatUserChange(c: ItemChange<User>): string {
  if (c.type === 'insert') {
    return `insert ${c.id}: ${formatUser(c.entity)}`;
  }
  if (c.type === 'update') {
    return `update ${c.id}: ${formatUser(c.oldEntity!)} -> ${formatUser(c.entity)}`;
  }
  return `delete ${c.id}: ${formatUser(c.entity)}`;
}

function formatPostChange(c: ItemChange<Post>): string {
  if (c.type === 'insert') {
    return `insert ${c.id}: ${formatPost(c.entity)}`;
  }
  if (c.type === 'update') {
    return `update ${c.id}: ${formatPost(c.oldEntity!)} -> ${formatPost(c.entity)}"`;
  }
  return `delete ${c.id}: ${formatPost(c.entity)}`;
}

function AppInner() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [userChanges, setUserChanges] = useState<string[]>([]);
  const [postChanges, setPostChanges] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostAuthorId, setEditPostAuthorId] = useState('');

  useEffect(() => {
    store.loadUsers().catch(() => {});
    store.loadPosts().catch(() => {});
  }, []);

  useEffect(() => {
    const unsubUsers = store.users.onChange(change => {
      setUserChanges(prev => [...prev, formatUserChange(change)].slice(-20));
    });
    const unsubPosts = store.posts.onChange(change => {
      setPostChanges(prev => [...prev, formatPostChange(change)].slice(-20));
    });
    return () => {
      unsubUsers();
      unsubPosts();
    };
  }, []);

  const handleAddUser = () => {
    if (!name || !age) {
      return;
    }
    store.addUser({ name, age: Number(age) });
    setName('');
    setAge('');
  };

  const handleAddPost = () => {
    if (!title || !authorId) {
      return;
    }
    store.addPost({ title, authorId });
    setTitle('');
    setAuthorId('');
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditAge(String(user.age));
  };

  const handleSaveUserEdit = () => {
    if (!editingUserId || !editName || !editAge) {
      return;
    }
    store.updateUser({
      id: editingUserId,
      name: editName,
      age: Number(editAge),
    });
    setEditingUserId(null);
    setEditName('');
    setEditAge('');
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setEditName('');
    setEditAge('');
  };

  const handleStartEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostAuthorId(post.authorId);
  };

  const handleSavePostEdit = () => {
    if (!editingPostId || !editPostTitle || !editPostAuthorId) {
      return;
    }
    store.updatePost({
      id: editingPostId,
      title: editPostTitle,
      authorId: editPostAuthorId,
    });
    setEditingPostId(null);
    setEditPostTitle('');
    setEditPostAuthorId('');
  };

  const handleCancelPostEdit = () => {
    setEditingPostId(null);
    setEditPostTitle('');
    setEditPostAuthorId('');
  };

  const handleDeleteUser = (id: string) => {
    store.deleteUser({ id });
  };

  const handleDeletePost = (id: string) => {
    store.deletePost({ id });
  };

  return (
    <Container>
      <Row>
        <Panel>
          <Title>Add User</Title>
          <AddUserForm
            name={name}
            age={age}
            onNameChange={setName}
            onAgeChange={setAge}
            onAdd={handleAddUser}
          />
        </Panel>
        <Panel>
          <Title>Add Post</Title>
          <AddPostForm
            title={title}
            authorId={authorId}
            users={store.users.all}
            onTitleChange={setTitle}
            onAuthorChange={setAuthorId}
            onAdd={handleAddPost}
          />
        </Panel>
      </Row>
      <Panel>
        <Title>Users & Posts</Title>
        <UsersWithPosts
          users={store.users.all}
          posts={store.posts.all}
          editingUserId={editingUserId}
          editName={editName}
          editAge={editAge}
          onStartEditUser={handleStartEditUser}
          onEditNameChange={setEditName}
          onEditAgeChange={setEditAge}
          onSaveUserEdit={handleSaveUserEdit}
          onCancelUserEdit={handleCancelUserEdit}
          editingPostId={editingPostId}
          editPostTitle={editPostTitle}
          editPostAuthorId={editPostAuthorId}
          onStartEditPost={handleStartEditPost}
          onEditPostTitleChange={setEditPostTitle}
          onEditPostAuthorIdChange={setEditPostAuthorId}
          onSavePostEdit={handleSavePostEdit}
          onCancelPostEdit={handleCancelPostEdit}
          onDeletePost={handleDeletePost}
          onDeleteUser={handleDeleteUser}
        />
      </Panel>
      <Row>
        <ChangeLog title="User Changes" entries={userChanges} />
        <ChangeLog title="Post Changes" entries={postChanges} />
      </Row>
    </Container>
  );
}

export const App = observer(AppInner);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;

const Panel = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const Title = styled.h2`
  margin: 0 0 16px;
  font-size: 18px;
`;
