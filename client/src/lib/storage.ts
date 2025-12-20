import { useState, useEffect } from 'react';
import { User, LeaveRequest, INITIAL_USERS, INITIAL_LEAVES } from './data';

const USERS_KEY = 'knockturn_users';
const LEAVES_KEY = 'knockturn_leaves';

export function getStoredUsers(): User[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
}

export function getStoredLeaves(): LeaveRequest[] {
  const stored = localStorage.getItem(LEAVES_KEY);
  if (!stored) {
    localStorage.setItem(LEAVES_KEY, JSON.stringify(INITIAL_LEAVES));
    return INITIAL_LEAVES;
  }
  return JSON.parse(stored);
}

export function addLeaveRequest(leave: LeaveRequest) {
  const leaves = getStoredLeaves();
  leaves.push(leave);
  localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));
  return leaves;
}

export function updateLeaveStatus(id: string, status: LeaveRequest['status'], actionBy: string, reason?: string) {
  const leaves = getStoredLeaves();
  const index = leaves.findIndex(l => l.id === id);
  if (index !== -1) {
    leaves[index] = {
      ...leaves[index],
      status,
      actionBy,
      reasonForAction: reason,
      actionDate: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));
  }
  return leaves;
}

export function addUser(user: User) {
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

export function updateUser(id: string, updatedData: Partial<User>) {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedData };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}

export function deleteUser(id: string) {
  const users = getStoredUsers();
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  return filtered;
}

export interface LeaveBalance {
  casual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
}

export function getLeaveBalance(employeeCode: string): LeaveBalance {
  const leaves = getStoredLeaves();
  const employeeLeaves = leaves.filter(
    l => l.employeeCode === employeeCode && l.status === 'Approved'
  );

  const casualUsed = employeeLeaves
    .filter(l => l.type === 'Casual')
    .length; // Assuming 1 leave request = 1 day for simplicity in this mock. 
             // Ideally we'd calculate days between startDate and endDate.
  
  const sickUsed = employeeLeaves
    .filter(l => l.type === 'Sick')
    .length;

  return {
    casual: {
      total: 10,
      used: casualUsed,
      remaining: Math.max(0, 10 - casualUsed)
    },
    sick: {
      total: 5,
      used: sickUsed,
      remaining: Math.max(0, 5 - sickUsed)
    }
  };
}
