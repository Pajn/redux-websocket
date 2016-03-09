'use strict'

import {expect} from 'chai'
import {findChanges} from 'redux-websocket/lib/_sync/find-changes'


describe('sync/find-changes', () => {
  describe('findChanges', () => {
    it('should find added properties', () => {
      const changes = findChanges({prop: 1}, {})

      expect(changes).to.deep.equal([{path: ['prop'], value: 1}])
    })

    it('should find modified properties', () => {
      const changes = findChanges({prop: 2}, {prop: 1})

      expect(changes).to.deep.equal([{path: ['prop'], value: 2}])
    })

    it('should find removed properties', () => {
      const changes = findChanges({}, {prop: 1})

      expect(changes).to.deep.equal([{path: ['prop'], removed: true}])
    })

    it('should find added nested properties', () => {
      const changes = findChanges({nested: {prop: 1}}, {nested: {}})

      expect(changes).to.deep.equal([{path: ['nested', 'prop'], value: 1}])
    })

    it('should find modified nested properties', () => {
      const changes = findChanges({nested: {prop: 2}}, {nested: {prop: 1}})

      expect(changes).to.deep.equal([{path: ['nested', 'prop'], value: 2}])
    })

    it('should find removed nested properties', () => {
      const changes = findChanges({nested: {}}, {nested: {prop: 1}})

      expect(changes).to.deep.equal([{path: ['nested', 'prop'], removed: true}])
    })

    it('should simplify complex changes', () => {
      const changes = findChanges(
        {nested: {a: 5, b: 6, c: 7, d: 3}},
        {nested: {a: 1, b: 2, c: 3, d: 4}}
      )

      expect(changes).to.deep.equal([{path: ['nested'], value: {a: 5, b: 6, c: 7, d: 3}}])
    })
  })

  describe('findVersionedChanges', () => {
  })

  describe('applyChanges', () => {
  })
})
