import { Collection, IndexedDBStorage } from 'bottle';
import { makeAutoObservable } from 'mobx';

type User = {
  id: string;
  name: string;
  age: number;
};

type Post = {
  id: string;
  title: string;
  authorId: string;
};

const API_BASE = '/api';

class Store {
  users = new Collection<User>({
    storage: new IndexedDBStorage<User>({ dbName: 'playground-users' }),
    create: async changes => {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes.entity),
      });
      if (!res.ok) {
        throw new Error('Failed to create user');
      }
    },
    update: async changes => {
      const res = await fetch(`${API_BASE}/users/${changes.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes.entity),
      });
      if (!res.ok) {
        throw new Error('Failed to update user');
      }
    },
    delete: async changes => {
      const res = await fetch(`${API_BASE}/users/${changes.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete user');
      }
    },
  });
  posts = new Collection<Post>({
    storage: new IndexedDBStorage<Post>({ dbName: 'playground-posts' }),
    create: async changes => {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes.entity),
      });
      if (!res.ok) {
        throw new Error('Failed to create post');
      }
    },
    update: async changes => {
      const res = await fetch(`${API_BASE}/posts/${changes.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes.entity),
      });
      if (!res.ok) {
        throw new Error('Failed to update post');
      }
    },
    delete: async changes => {
      const res = await fetch(`${API_BASE}/posts/${changes.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete post');
      }
    },
  });

  constructor() {
    makeAutoObservable(this);
  }

  async loadFromStorage() {
    await this.users.load();
    await this.posts.load();
  }

  async loadUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) {
      throw new Error('Failed to load users');
    }
    const users: User[] = await res.json();
    for (const user of users) {
      this.users.ingest({ entity: user });
    }
  }

  async loadPosts() {
    const res = await fetch(`${API_BASE}/posts`);
    if (!res.ok) {
      throw new Error('Failed to load posts');
    }
    const posts: Post[] = await res.json();
    for (const post of posts) {
      this.posts.ingest({ entity: post });
    }
  }

  addUser(args: { name: string; age: number }) {
    const { name, age } = args;
    const id = `u-${Date.now()}`;
    this.users.upsert({
      entity: { id, name, age },
      autoCommit: true,
    });
  }

  updateUser(args: { id: string; name: string; age: number }) {
    const { id, name, age } = args;
    this.users.update({
      id,
      patch: { name, age },
      autoCommit: true,
    });
  }

  deleteUser(args: { id: string }) {
    const { id } = args;
    this.users.delete({
      id,
      autoCommit: true,
    });
  }

  addPost(args: { title: string; authorId: string }) {
    const { title, authorId } = args;
    const id = `p-${Date.now()}`;
    this.posts.upsert({
      entity: { id, title, authorId },
      autoCommit: false,
    });
  }

  updatePost(args: { id: string; title: string; authorId: string }) {
    const { id, title, authorId } = args;
    this.posts.update({
      id,
      patch: { title, authorId },
      autoCommit: false,
    });
  }

  deletePost(args: { id: string }) {
    const { id } = args;
    this.posts.delete({
      id,
      autoCommit: true,
    });
  }

  commitPost(args: { id: string }) {
    const { id } = args;
    return this.posts.commit({ id });
  }

  rollbackPost(args: { id: string }) {
    const { id } = args;
    this.posts.rollback({ id });
  }
}

export const store = new Store();
export type { User, Post };
