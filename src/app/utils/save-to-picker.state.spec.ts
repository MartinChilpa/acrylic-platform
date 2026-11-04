import {
  buildRequest,
  buildUndo,
  canSubmit,
  destinationNames,
  filterProjects,
  initialSelection,
  isDuplicateName,
  isSavedLocked,
  joinNames,
  selectProject,
  summaryKey,
  toggleProject,
  toggleSaved,
} from './save-to-picker.state';

const projects = [
  { uuid: 'p-arg', name: 'Argentina' },
  { uuid: 'p-sen', name: 'Senegalese music' },
  { uuid: 'p-tra', name: 'Travel stories' },
];

describe('save-to picker state', () => {
  describe('auto-include Saved tracks', () => {
    it('checks Saved when a project is chosen', () => {
      const next = toggleProject(initialSelection('single', null), 'p-arg');
      expect(next.saved).toBeTrue();
      expect([...next.projects]).toEqual(['p-arg']);
    });

    it('locks Saved while any project is chosen', () => {
      const withProject = toggleProject(initialSelection('single', null), 'p-arg');
      expect(isSavedLocked(withProject)).toBeTrue();
      expect(toggleSaved(withProject).saved).toBeTrue();
    });

    it('keeps Saved after the last project is unchecked, and lets it be unchecked then', () => {
      const one = toggleProject(initialSelection('single', null), 'p-arg');
      const none = toggleProject(one, 'p-arg');
      expect(none.saved).toBeTrue();
      expect(isSavedLocked(none)).toBeFalse();
      expect(toggleSaved(none).saved).toBeFalse();
    });

    it('always sends saved=true with projects even if Saved was never touched', () => {
      const selection = { saved: false, projects: new Set(['p-tra']) };
      expect(buildRequest('single', ['t1'], selection).items[0].saved).toBeTrue();
    });

    it('checks a project created from inside the picker', () => {
      const next = selectProject(initialSelection('single', null), 'p-new');
      expect(next.projects.has('p-new')).toBeTrue();
      expect(next.saved).toBeTrue();
    });
  });

  describe('single mode', () => {
    it('starts empty with Add disabled', () => {
      const initial = initialSelection('single', { track_uuid: 't1', saved: true, project_uuids: ['p-arg'] });
      expect(initial.saved).toBeFalse();
      expect(initial.projects.size).toBe(0);
      expect(canSubmit('single', initial, initial)).toBeFalse();
    });

    it('allows Saved tracks only', () => {
      const initial = initialSelection('single', null);
      const savedOnly = toggleSaved(initial);
      expect(canSubmit('single', savedOnly, initial)).toBeTrue();
      expect(buildRequest('single', ['t1'], savedOnly)).toEqual({
        mode: 'add',
        items: [{ track_uuid: 't1', saved: true, project_uuids: [] }],
      });
      expect(summaryKey(savedOnly).key).toBe('saveTo.summary.savedOnly');
    });

    it('summarises several projects', () => {
      let s = initialSelection('single', null);
      s = toggleProject(s, 'p-arg');
      s = toggleProject(s, 'p-tra');
      expect(summaryKey(s)).toEqual({ key: 'saveTo.summary.projectsOther', params: { count: 2 } });
      expect(summaryKey(toggleProject(s, 'p-tra'))).toEqual({ key: 'saveTo.summary.projectsOne', params: { count: 1 } });
    });
  });

  describe('bulk mode', () => {
    it('adds the same destinations to every track without removing anything', () => {
      const s = toggleProject(initialSelection('bulk', null), 'p-sen');
      const request = buildRequest('bulk', ['t1', 't2', 't3'], s);
      expect(request.mode).toBe('add');
      expect(request.items.map(i => i.track_uuid)).toEqual(['t1', 't2', 't3']);
      expect(request.items.every(i => i.saved && i.project_uuids.join() === 'p-sen')).toBeTrue();
    });
  });

  describe('edit mode', () => {
    const current = { track_uuid: 't1', saved: true, project_uuids: ['p-arg', 'p-tra'] };

    it('opens on the current destinations', () => {
      const initial = initialSelection('edit', current);
      expect(initial.saved).toBeTrue();
      expect([...initial.projects].sort()).toEqual(['p-arg', 'p-tra']);
    });

    it('enables Save changes only when something changed', () => {
      const initial = initialSelection('edit', current);
      expect(canSubmit('edit', initial, initial)).toBeFalse();
      const changed = toggleProject(initial, 'p-arg');
      expect(canSubmit('edit', changed, initial)).toBeTrue();
      expect(canSubmit('edit', toggleProject(changed, 'p-arg'), initial)).toBeFalse();
    });

    it('sends exactly the chosen destinations', () => {
      const changed = toggleProject(initialSelection('edit', current), 'p-arg');
      expect(buildRequest('edit', ['t1'], changed)).toEqual({
        mode: 'set',
        items: [{ track_uuid: 't1', saved: true, project_uuids: ['p-tra'] }],
      });
    });
  });

  describe('undo', () => {
    it('restores every track exactly as it was', () => {
      const before = [
        { track_uuid: 't1', saved: false, project_uuids: [] },
        { track_uuid: 't2', saved: true, project_uuids: ['p-arg'] },
      ];
      const undo = buildUndo(before);
      expect(undo.mode).toBe('set');
      expect(undo.items).toEqual(before);
      // a copy, so later edits to the snapshot don't leak into the request
      expect(undo.items[1].project_uuids).not.toBe(before[1].project_uuids);
    });
  });

  describe('labels and search', () => {
    it('names the chosen projects in list order, or Saved tracks alone', () => {
      const s = { saved: true, projects: new Set(['p-tra', 'p-arg']) };
      expect(destinationNames(s, projects, 'Saved tracks')).toEqual(['Argentina', 'Travel stories']);
      expect(destinationNames({ saved: true, projects: new Set() }, projects, 'Saved tracks')).toEqual(['Saved tracks']);
      expect(joinNames(['Argentina', 'Travel stories'], 'en')).toBe('Argentina and Travel stories');
    });

    it('filters projects ignoring case and accents', () => {
      expect(filterProjects(projects, 'SÉNÉ').map(p => p.uuid)).toEqual(['p-sen']);
      expect(filterProjects(projects, 'Brazil')).toEqual([]);
      expect(filterProjects(projects, '  ').length).toBe(3);
    });

    it('detects duplicate names, ignoring the project being renamed', () => {
      expect(isDuplicateName(' argentina ', projects)).toBeTrue();
      expect(isDuplicateName('Argentina', projects, 'p-arg')).toBeFalse();
      expect(isDuplicateName('', projects)).toBeFalse();
    });
  });
});
