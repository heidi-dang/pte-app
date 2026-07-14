import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidRole, ALL_ROLES, hasPermission, type UserRole } from './rbac.js';

describe('RBAC', () => {
  it('contains all five required roles', () => {
    const required: UserRole[] = ['student', 'teacher', 'content_editor', 'admin', 'support'];
    for (const role of required) {
      assert.ok(ALL_ROLES.includes(role), `Role ${role} should be defined`);
      assert.ok(isValidRole(role), `Role ${role} should be valid`);
    }
    assert.equal(ALL_ROLES.length, 5);
  });

  it('rejects invalid roles', () => {
    assert.equal(isValidRole('content_manager'), false);
    assert.equal(isValidRole('superadmin'), false);
    assert.equal(isValidRole(''), false);
  });

  it('defines permissions for each role', () => {
    const roleToDashboard: Record<string, string> = {
      student: 'student',
      teacher: 'teacher',
      content_editor: 'content',
      admin: 'admin',
      support: 'support',
    };
    for (const [role, dash] of Object.entries(roleToDashboard)) {
      const perms = hasPermission([role as UserRole], `dashboard:${dash}`);
      assert.ok(perms, `Role ${role} should have dashboard:${dash} permission`);
    }
  });

  describe('permission isolation', () => {
    it('student cannot access teacher dashboard', () => {
      assert.equal(hasPermission(['student'], 'dashboard:teacher'), false);
    });

    it('student cannot access admin dashboard', () => {
      assert.equal(hasPermission(['student'], 'dashboard:admin'), false);
    });

    it('teacher cannot access admin dashboard', () => {
      assert.equal(hasPermission(['teacher'], 'dashboard:admin'), false);
    });

    it('content_editor cannot access admin dashboard', () => {
      assert.equal(hasPermission(['content_editor'], 'dashboard:admin'), false);
    });

    it('support cannot access admin dashboard', () => {
      assert.equal(hasPermission(['support'], 'dashboard:admin'), false);
    });

    it('student cannot access content dashboard', () => {
      assert.equal(hasPermission(['student'], 'dashboard:content'), false);
    });

    it('teacher cannot access support dashboard', () => {
      assert.equal(hasPermission(['teacher'], 'dashboard:support'), false);
    });

    it('admin can access all dashboards', () => {
      assert.ok(hasPermission(['admin'], 'dashboard:student'));
      assert.ok(hasPermission(['admin'], 'dashboard:teacher'));
      assert.ok(hasPermission(['admin'], 'dashboard:admin'));
      assert.ok(hasPermission(['admin'], 'dashboard:content'));
      assert.ok(hasPermission(['admin'], 'dashboard:support'));
    });
  });
});
