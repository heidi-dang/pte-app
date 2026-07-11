import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Course, Lesson } from '@pte-app/domain';
import { CourseEngineService } from './course-engine.js';

describe('CourseEngineService', () => {
  let engine: CourseEngineService;

  before(() => {
    const courses = new Map<string, Course>();
    courses.set('course_001', {
      id: 'course_001',
      title: 'PTE Basics',
      description: 'Foundation course',
      modules: [
        {
          id: 'mod_1',
          title: 'Introduction',
          lessons: [{ id: 'lesson_001', title: 'Welcome', order: 1, estimatedMinutes: 5 }],
          order: 1,
        },
      ],
      isFree: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const lessons = new Map<string, Lesson>();
    lessons.set('lesson_001', {
      id: 'lesson_001',
      courseId: 'course_001',
      moduleId: 'mod_1',
      title: 'Welcome',
      content: [{ type: 'text', id: 'block_1', data: { body: 'Hello' }, order: 1 }],
      estimatedMinutes: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    engine = new CourseEngineService(courses, lessons, new Map(), new Map());
  });

  it('lists courses', async () => {
    const result = await engine.listCourses();
    assert.equal(result.total, 1);
    assert.equal(result.courses[0]!.title, 'PTE Basics');
  });

  it('filters free courses', async () => {
    const result = await engine.listCourses({ isFree: true });
    assert.equal(result.total, 1);
  });

  it('gets course by id', async () => {
    const course = await engine.getCourse('course_001');
    assert.ok(course);
    assert.equal(course!.title, 'PTE Basics');
  });

  it('enrols user', async () => {
    const enrolment = await engine.enrol('user_1', 'course_001');
    assert.equal(enrolment.userId, 'user_1');
    assert.equal(enrolment.completed, false);
  });

  it('gets lesson', async () => {
    const lesson = await engine.getLesson('lesson_001');
    assert.ok(lesson);
    assert.equal(lesson!.title, 'Welcome');
  });

  it('saves and retrieves progress', async () => {
    await engine.saveProgress('user_1', 'lesson_001', { lessonId: 'lesson_001', completed: true });
    const progress = await engine.getProgress('user_1', 'lesson_001');
    assert.ok(progress);
    assert.equal(progress!.completed, true);
  });

  it('tracks course completion', async () => {
    const enrolment = await engine.getEnrolment('user_1', 'course_001');
    assert.ok(enrolment);
    assert.equal(enrolment!.completed, true);
  });
});
