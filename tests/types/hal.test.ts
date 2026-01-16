import { describe, it, expect } from 'vitest';
import {
  isHalResource,
  isHalResourceArray,
  getEmbedded,
  getLink,
  getTemplate,
  type HalResource,
} from '../../src/types/hal';

describe('HAL Type Utilities', () => {
  const sampleResource: HalResource = {
    id: '1',
    title: 'Test Resource',
    _links: {
      self: { href: '/resources/1' },
      next: { href: '/resources/2' },
      items: [
        { href: '/items/1' },
        { href: '/items/2' },
      ],
    },
    _embedded: {
      author: {
        name: 'John Doe',
        _links: { self: { href: '/authors/1' } },
      },
      comments: [
        { id: '1', text: 'First comment', _links: { self: { href: '/comments/1' } } },
        { id: '2', text: 'Second comment', _links: { self: { href: '/comments/2' } } },
      ],
    },
    _templates: {
      default: {
        method: 'PUT',
        properties: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text' },
        ],
      },
      delete: {
        method: 'DELETE',
      },
    },
  };

  describe('isHalResource', () => {
    it('should return true for valid HAL resource', () => {
      expect(isHalResource(sampleResource)).toBe(true);
    });

    it('should return false for non-object', () => {
      expect(isHalResource('string')).toBe(false);
      expect(isHalResource(123)).toBe(false);
      expect(isHalResource(null)).toBe(false);
      expect(isHalResource(undefined)).toBe(false);
    });

    it('should return false for object without _links', () => {
      expect(isHalResource({ id: '1' })).toBe(false);
    });

    it('should return false for object without self link', () => {
      expect(isHalResource({ _links: { next: { href: '/next' } } })).toBe(false);
    });
  });

  describe('isHalResourceArray', () => {
    it('should return true for array of HAL resources', () => {
      const resources = [
        { _links: { self: { href: '/1' } } },
        { _links: { self: { href: '/2' } } },
      ];
      expect(isHalResourceArray(resources)).toBe(true);
    });

    it('should return false for single HAL resource', () => {
      expect(isHalResourceArray(sampleResource)).toBe(false);
    });
  });

  describe('getEmbedded', () => {
    it('should return single embedded resource', () => {
      const author = getEmbedded(sampleResource, 'author');
      expect(author).toEqual({
        name: 'John Doe',
        _links: { self: { href: '/authors/1' } },
      });
    });

    it('should return array of embedded resources', () => {
      const comments = getEmbedded(sampleResource, 'comments');
      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(2);
    });

    it('should return null for non-existent relation', () => {
      expect(getEmbedded(sampleResource, 'nonexistent')).toBe(null);
    });

    it('should return null for resource without _embedded', () => {
      const resource: HalResource = { _links: { self: { href: '/' } } };
      expect(getEmbedded(resource, 'any')).toBe(null);
    });
  });

  describe('getLink', () => {
    it('should return single link', () => {
      const selfLink = getLink(sampleResource, 'self');
      expect(selfLink).toEqual({ href: '/resources/1' });
    });

    it('should return array of links', () => {
      const items = getLink(sampleResource, 'items');
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(2);
    });

    it('should return null for non-existent relation', () => {
      expect(getLink(sampleResource, 'nonexistent')).toBe(null);
    });

    it('should return null for resource without _links', () => {
      const resource = {} as HalResource;
      expect(getLink(resource, 'self')).toBe(null);
    });
  });

  describe('getTemplate', () => {
    it('should return default template', () => {
      const template = getTemplate(sampleResource);
      expect(template).toEqual({
        method: 'PUT',
        properties: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text' },
        ],
      });
    });

    it('should return named template', () => {
      const template = getTemplate(sampleResource, 'delete');
      expect(template).toEqual({ method: 'DELETE' });
    });

    it('should return null for non-existent template', () => {
      expect(getTemplate(sampleResource, 'nonexistent')).toBe(null);
    });

    it('should return null for resource without _templates', () => {
      const resource: HalResource = { _links: { self: { href: '/' } } };
      expect(getTemplate(resource)).toBe(null);
    });
  });
});
