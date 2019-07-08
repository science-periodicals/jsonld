import assert from 'assert';
import { toIndexableString } from '@scipe/collate';
import {
  promises as jsonld,
  jsonld as callbacks,
  getValue,
  textify,
  dearrayify,
  createValue,
  getId,
  nodeify,
  unprefix,
  prefix,
  flatten,
  frame,
  purge,
  createNash,
  embed,
  getSubNodeMap,
  unrole,
  context
} from '../src';
import relabelNodes from '../src/lib/relabel-nodes';
import uuid from 'uuid';

describe('@scienceai/jsonld', function() {
  describe('jsonld export and plugins', function() {
    const rdfa =
      '<body prefix="schema: http://schema.org/ sa: http://ns.sci.pe#" resource="http://example.com" typeof="sa:Graph"><span property="schema:name">name</span></body>';

    const expected = {
      '@context': 'https://sci.pe',
      '@id': 'http://example.com',
      '@type': 'Graph',
      name: 'name'
    };

    it('should have sci.pe context and custom RDFa parser loaded with the promises interface', function() {
      return jsonld
        .fromRDF(rdfa, { format: 'text/html' })
        .then(data => {
          return jsonld.compact(data, 'https://sci.pe');
        })
        .then(compacted => {
          assert.deepEqual(compacted, expected);
        });
    });

    it('should have sci.pe context and custom RDFa parser loaded with the callback interface', function(done) {
      callbacks.fromRDF(rdfa, { format: 'text/html' }, (err, data) => {
        callbacks.compact(data, 'https://sci.pe', (err, compacted) => {
          assert.deepEqual(compacted, expected);
          done();
        });
      });
    });
  });

  it('should throw on loader assignment', function() {
    let error = false;
    try {
      jsonld.documentLoader = () => {};
      assert(false, 'should have thrown on assignment');
    } catch (e) {
      error = !!e;
    }
    assert(error, 'threw properly for assignment');
  });

  it('should throw when reconfigured', function() {
    let error = false;
    try {
      Object.defineProperty(jsonld, 'documentLoader', {
        value: 42,
        configurable: true,
        enumerable: true,
        writable: true
      });
      assert(false, 'should have thrown on defineProperty');
    } catch (e) {
      error = !!e;
    }
    assert(error, 'threw properly for defineProperty');
  });

  describe('relabelNodes', () => {
    it('should not relabel sameAs', () => {
      const graph = {
        '@graph': [
          {
            '@id': 'scipe:a',
            sameAs: ['scipe:x']
          },
          {
            '@id': 'scipe:b'
          }
        ]
      };
      const relabeled = relabelNodes(graph, {
        relabelMap: {
          'scipe:x': 'scipe:x2',
          'scipe:b': 'scipe:b2'
        },
        sameAs: true
      });
      assert.equal(relabeled['@graph'][0].sameAs[0], 'scipe:x');
      assert.equal(relabeled['@graph'][1]['@id'], 'scipe:b2');
      assert.equal(relabeled['@graph'][1].sameAs[0], 'scipe:b');
    });
  });

  describe('map blank node to uuid', function() {
    it('should relabel blank nodes and handle the sameAs option', function() {
      const graph = {
        mainEntity: '_:b',
        '@graph': [
          {
            '@id': '_:a',
            hasPart: ['_:b'],
            isBasedOn: '_:c'
          },
          {
            '@id': '_:b',
            name: 'b'
          },
          {
            '@id': '_:c',
            name: 'c'
          }
        ]
      };

      const relabeled = relabelNodes(graph, {
        blankNode: true,
        sameAs: 'all',
        relabelMap: { '_:b': 'scipe:b', '_:c': 'scipe:c' }
      });
      assert.deepEqual(relabeled, {
        mainEntity: 'scipe:b',
        '@graph': [
          {
            '@id': '_:a',
            hasPart: ['scipe:b'],
            isBasedOn: 'scipe:c'
          },
          {
            '@id': 'scipe:b',
            name: 'b',
            sameAs: ['_:b']
          },
          {
            '@id': 'scipe:c',
            name: 'c',
            sameAs: ['_:c']
          }
        ]
      });
    });

    it('should relabelNodes and properly handle the sameAs option with a graph', () => {
      const uuidv4 = uuid.v4();
      const uuidv1 = uuid.v1();
      const graph = {
        '@graph': [
          {
            '@id': `_:${uuidv4}`,
            name: 'v4'
          },
          {
            '@id': `_:${uuidv1}`,
            name: 'v1'
          },
          {
            '@id': `_:x`,
            name: 'x'
          }
        ]
      };
      const blankNodeMap = {
        [`_:${uuidv4}`]: `scipe:${uuidv4}`,
        [`_:${uuidv1}`]: `scipe:${uuidv1}`,
        '_:x': 'scipe:x'
      };

      const relabeled = relabelNodes(graph, {
        relabelMap: blankNodeMap,
        sameAs: true
      });
      assert.deepEqual(
        relabeled,
        {
          '@graph': [
            {
              '@id': `scipe:${uuidv4}`,
              name: 'v4',
              sameAs: [`_:${uuidv4}`]
            },
            {
              '@id': `scipe:${uuidv1}`,
              name: 'v1',
              sameAs: [`_:${uuidv1}`]
            },
            {
              '@id': `scipe:x`,
              name: 'x'
            }
          ]
        },
        'blank node uuid are listed as sameAs'
      );
    });

    it('should remap blank nodes to uuid when the uuid flag is passed', function(done) {
      const data = {
        '@context': {
          '@vocab': 'http://schema.org',
          creator: {
            '@id': 'http://schema.org/creator',
            '@type': '@id'
          },
          name: 'http://schema.org/name',
          contentChecksum: {
            '@id': 'http://ns.sci.pe/contentChecksum',
            '@container': '@set'
          },
          encoding: {
            '@id': 'http://schema.org/encoding',
            '@type': '@id',
            '@container': '@list'
          },
          ppi: 'http://example.com/ppi',
          checksumAlgorithm: 'http://ns.sci.pe/contentAlgorithm',
          dateCreated: 'http://schema.org/dateCreated'
        },
        creator: {
          name: 'peter'
        },
        encoding: [
          {
            name: 'encoding name',
            contentChecksum: [
              {
                checksumAlgorithm: 'sha256'
              }
            ],
            ppi: {
              height: 10,
              width: 20
            },
            dateCreated: {
              '@type': 'xsd:gYear',
              '@value': 2015
            }
          }
        ]
      };

      callbacks.flatten(data, data['@context'], (err, flattened) => {
        // we expect something like where all the blanknodes have been remapped
        // console.log(util.inspect(flattened, {depth: null}));
        // [ { '@id': '_:b0', creator: '_:b1', encoding: [ '_:b2' ] },
        //   { '@id': '_:b1', name: 'peter' },
        //   { '@id': '_:b2',
        //     ppi: { '@id': '_:b3' },
        //     contentChecksum: [ { '@id': '_:b4' } ],
        //     dateCreated: { '@type': 'xsd:gYear', '@value': 2015 },
        //     name: 'encoding name' },
        //   { '@id': '_:b3', heigh: 10, width: 20 },
        //   { '@id': '_:b4', checksumAlgorithm: 'sha256' } ]

        relabelNodes(flattened, { uuid: true, blankNode: true });

        const nodes = flattened['@graph'];
        const re = /^_:[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i; // to test for uuid.v4
        assert(re.test(nodes[0]['@id']));
        assert(re.test(nodes[0].creator));
        assert(re.test(nodes[0].encoding[0]));

        assert(re.test(nodes[1]['@id']));

        assert(re.test(nodes[2]['@id']));
        assert(re.test(nodes[2].contentChecksum[0]['@id']));
        assert(re.test(nodes[2].ppi['@id']));

        assert(re.test(nodes[3]['@id']));
        done();
      });
    });
  });

  describe('flatten', function() {
    // @context will be added automatically by `flatten`
    const doc = {
      creator: {
        name: 'peter'
      }
    };
    const re = /^_:[A-Za-z0-9_:\-]/; // to test for uuid

    it('callback API', function(done) {
      flatten(doc, (err, flattened) => {
        assert(re.test(flattened['@graph'][0]['@id']));
        done();
      });
    });

    it('promises API', function() {
      return flatten(doc).then(flattened => {
        assert(re.test(flattened['@graph'][0]['@id']));
      });
    });

    it('should preserve blank nodes that have an _id', done => {
      const doc = {
        creator: {
          _id: toIndexableString(['scopeId', 'node', '_:nodeId']),
          '@id': '_:nodeId',
          name: 'peter'
        }
      };
      flatten(doc, (err, flattened) => {
        if (err) return done(err);
        assert(
          flattened['@graph'].some(node => node['@id'] === doc.creator['@id'])
        );
        done();
      });
    });

    it('should preserve uuid blank nodes when called with preserveUuidBlankNodes option', done => {
      const doc = {
        creator: {
          '@id': `_:${uuid.v4()}`,
          name: 'peter'
        }
      };
      flatten(doc, { preserveUuidBlankNodes: true }, (err, flattened) => {
        if (err) return done(err);
        assert(
          flattened['@graph'].some(node => node['@id'] === doc.creator['@id'])
        );
        done();
      });
    });
  });

  describe('createNash', function() {
    // @context will be added automatically`
    const doc = {
      creator: {
        name: 'peter'
      }
    };

    const expected = 'ywql/OlHTc1v7UuPtTxF9uLsQFG5NxBdpPSNepjWNyY=';

    it('callback API', function(done) {
      createNash(doc, (err, nash) => {
        assert.equal(nash, expected);
        done();
      });
    });

    it('promises API', function() {
      return createNash(doc).then(nash => {
        assert.equal(nash, expected);
      });
    });
  });

  describe('frame', function() {
    const doc = {
      creator: {
        '@id': 'tmp:root',
        name: 'peter',
        knows: {
          '@type': 'Person',
          name: 'manu'
        },
        memberOf: {
          '@id': `_:${uuid.v4()}`,
          '@type': 'Organization',
          funder: [
            {
              '@id': `_:a`,
              '@type': 'Corporation'
            }
          ]
        }
      }
    };
    const docFrame = {
      '@id': 'tmp:root',
      '@embed': '@always'
    };
    let flattened;

    before(function(done) {
      // @context will be added automatically`
      flatten(doc, { preserveUuidBlankNodes: true }, (err, _flattened) => {
        flattened = _flattened;
        done();
      });
    });

    it('callback API', function(done) {
      frame(flattened, docFrame, (err, framed) => {
        assert.equal(framed['@graph'][0].name, 'peter');
        done();
      });
    });

    it('promise API', function() {
      frame(flattened, docFrame).then(framed => {
        assert.equal(framed['@graph'][0].name, 'peter');
      });
    });

    it('should remove unnecessary blank node IDs after framing when called with removeUnnecessaryBlankNodeIds opts', function(done) {
      frame(
        flattened,
        docFrame,
        { removeUnnecessaryBlankNodeIds: true },
        (err, framed) => {
          if (err) return done(err);
          assert(
            !framed['@graph'][0]['knows']['@id'],
            'unecessary id has been removed'
          );
          done();
        }
      );
    });

    it('should preserve blank nodes when called with preserveUuidBlankNodes', done => {
      frame(
        flattened,
        docFrame,
        { preserveUuidBlankNodes: true },
        (err, framed) => {
          if (err) return done(err);
          const framedMemberId = framed['@graph'][0]['memberOf']['@id'];
          const framedFunderId =
            framed['@graph'][0]['memberOf']['funder'][0]['@id'];

          assert.equal(framedMemberId, doc.creator.memberOf['@id']);
          assert(framedFunderId !== doc.creator.memberOf.funder[0]['@id']);
          done();
        }
      );
    });

    it('should preserve blank nodes UUIDs when called with preserveUuidBlankNodes and removeUnnecessaryBlankNodeIds (make sure that they are not removed)', done => {
      frame(
        flattened,
        docFrame,
        { preserveUuidBlankNodes: true, removeUnnecessaryBlankNodeIds: true },
        (err, framed) => {
          if (err) return done(err);
          const framedMemberId = framed['@graph'][0]['memberOf']['@id'];

          assert.equal(framedMemberId, doc.creator.memberOf['@id']);
          done();
        }
      );
    });
  });

  describe('purge', function() {
    const doc = {
      creator: {
        '@id': 'tmp:root',
        name: 'peter'
      },
      contributor: {
        name: 'will be purged'
      }
    };

    it('callback API', function(done) {
      purge(doc, 'tmp:root', (err, purged) => {
        assert.equal(purged['@graph'].length, 1);
        done();
      });
    });

    it('promise API', function() {
      purge(doc, 'tmp:root').then(purged => {
        assert.equal(purged['@graph'].length, 1);
      });
    });

    it('should preserve uuid blank nodes and graph metadata', done => {
      const personId = `scipe:${uuid.v4()}`;
      const orgId = `_:${uuid.v4()}`;
      const funderId = `_:${uuid.v4()}`;
      const graph = {
        name: 'graph',
        author: {
          '@id': 'user:user',
          name: 'user'
        },
        '@graph': [
          {
            '@id': personId,
            '@type': 'Person',
            memberOf: orgId
          },
          {
            '@id': orgId,
            '@type': 'Organization',
            funder: [funderId]
          },
          {
            '@id': funderId,
            '@type': 'Corporation'
          }
        ]
      };

      purge(
        graph,
        personId,
        { preserveUuidBlankNodes: true },
        (err, purged) => {
          if (err) return done(err);
          const nodes = purged['@graph'];
          const person = nodes.find(node => node['@type'] === 'Person');
          const org = nodes.find(node => node['@type'] === 'Organization');
          const funder = nodes.find(node => node['@type'] === 'Corporation');
          assert.equal(purged.name, graph.name);
          assert.deepEqual(purged.author, graph.author);
          assert.equal(nodes.length, 3);
          assert.equal(person['@id'], personId);
          assert.equal(org['@id'], orgId);
          assert.equal(funder['@id'], funderId);
          done();
        }
      );
    });
  });

  describe('dearrayify', function() {
    it('should dearrayify', function() {
      assert(!Array.isArray(dearrayify(1, [1])));
      assert(Array.isArray(dearrayify([1], [1])));
    });
  });

  describe('getValue', function() {
    it('should get the value of a JSON-LD node when node is an object with an @id', function() {
      assert.equal(getValue({ '@id': 'value' }), 'value');
    });
    it('should get the value of a JSON-LD node when node is an object with an @value', function() {
      assert.equal(getValue({ '@value': 'value' }), 'value');
    });
    it('should get the value of a JSON-LD node when node is a string, number etc.', function() {
      assert.equal(getValue('value'), 'value');
    });
    it('should return the array if the node is an array', function() {
      assert.deepEqual(getValue(['value']), ['value']);
    });
  });

  describe('createValue', function() {
    it('should return a typed value', function() {
      const str = 'with <span>markup</span>';
      assert.deepEqual(createValue(str), {
        '@type': 'rdf:HTML',
        '@value': str
      });
    });

    it('should return a string', function() {
      const str = 'without markup';
      assert.equal(createValue(str), str);
    });

    it('should handle the coerceSinglePWithNoMarkupToText options', function() {
      const str = '<p>without inner markup</p>';
      assert.equal(
        createValue(str, { coerceSinglePWithNoMarkupToText: true }),
        'without inner markup'
      );
    });
  });

  describe('getId', function() {
    it('should get the @id', function() {
      assert.equal(getId({ '@id': 'value' }), 'value');
      assert.equal(getId('value'), 'value');
    });

    it('should get the @id when the value is an array of length 1', function() {
      assert.equal(getId([{ '@id': 'value' }]), 'value');
      assert.equal(getId(['value']), 'value');
    });

    it('should get the @id with roleProp', function() {
      assert.equal(
        getId({ '@id': 'roleId', agent: 'agentId' }, 'agent'),
        'agentId'
      );
      assert.equal(
        getId({ '@id': 'roleId', agent: { '@id': 'agentId' } }, 'agent'),
        'agentId'
      );
      assert.equal(
        getId({ '@id': 'roleId', agent: ['agentId'] }, 'agent'),
        'agentId'
      );
      assert.equal(
        getId([{ '@id': 'roleId', agent: ['agentId'] }], 'agent'),
        'agentId'
      );
    });
  });

  describe('unprefix', function() {
    it('should unprefix', function() {
      assert.equal(unprefix('scipe:graphId'), 'graphId');
    });
  });

  describe('prefix', function() {
    it('should prefix', function() {
      assert.equal(prefix('name'), 'schema:name');
      assert.equal(prefix('roleAction'), 'sa:roleAction');
    });
  });

  describe('getSubNodeMap', function() {
    it('should get a subNodeMap', () => {
      const node = {
        '@id': 'ex:1',
        license: 'ex:2',
        creator: 'ex:3'
      };

      const nodeMap = {
        'ex:1': node,
        'ex:2': {
          '@id': 'ex:2',
          name: 'license',
          creator: 'ex:3'
        },
        'ex:3': {
          '@id': 'ex:3',
          name: 'creator'
        }
      };

      const subNodeMap = getSubNodeMap(node, nodeMap, ['license'], {
        blacklist: ['creator']
      });
      assert.equal(Object.keys(subNodeMap).length, 1);
      assert.equal(Object.keys(subNodeMap)[0], 'ex:2');
    });
  });

  describe('embed', function() {
    let framed, flattened;

    before(done => {
      const doc = {
        '@context': {
          ex: 'http://example.com',
          sameAs: {
            '@id': 'http://schema.org/sameAs',
            '@container': '@list',
            '@type': '@id'
          },
          author: {
            '@id': 'http://schema.org/author',
            '@type': '@id'
          },
          name: 'http://schema.org/name',
          givenName: 'http://schema.org/givenName',
          affiliation: 'http://schema.org/affiliation',
          member: {
            '@id': 'http://schema.org/member',
            '@container': '@set',
            '@type': '@id'
          },
          Organization: 'http://schema.org/Organization',
          Person: 'http://schema.org/Person',
          ScholarlyArticle: 'http://schema.org/ScholarlyArticle',
          Role: 'http://schema.org/Role',
          datePublished: 'http://schema.org/datePublished',
          isSupportingResource: 'xsd:boolean'
        },
        '@id': 'ex:article',
        '@type': 'ScholarlyArticle',
        isSupportingResource: true,
        sameAs: ['ex:a', 'ex:b'],
        author: {
          '@type': 'Role',
          author: {
            '@id': 'ex:peter',
            '@type': 'Person',
            name: 'Peter',
            affiliation: {
              '@type': 'Organization',
              name: 'Merck',
              member: {
                '@id': 'ex:peter',
                '@type': 'Person',
                name: 'Peter',
                givenName: 'Peter'
              }
            }
          }
        }
      };
      callbacks.flatten(
        doc,
        { '@context': doc['@context'] },
        (err, _flattened) => {
          if (err) return done(err);
          flattened = _flattened;
          const frame = {
            '@context': doc['@context'],
            '@embed': '@always',
            '@type': 'ScholarlyArticle'
          };
          callbacks.frame(
            flattened,
            frame,
            { omitDefault: true },
            (err, _framed) => {
              if (err) return done(err);
              framed = _framed;
              done();
            }
          );
        }
      );
    });

    it('should create a tree from a graph', () => {
      assert.deepEqual(embed('ex:article', flattened), framed['@graph'][0]);
    });

    it('should have worked with boolean', () => {
      assert.equal(
        typeof embed('ex:article', flattened).isSupportingResource,
        'boolean'
      );
    });

    it('should create a tree from a nodeMap', () => {
      const nodeMap = flattened['@graph'].reduce((nodeMap, node) => {
        nodeMap[node['@id']] = node;
        return nodeMap;
      }, {});

      assert.deepEqual(embed('ex:article', nodeMap), framed['@graph'][0]);
    });
  });

  describe('textify', () => {
    it('should produce nothing for nothing', () => {
      assert.equal(textify(), '', 'safe return');
      assert.equal(textify([]), '', 'safe return, array');
      assert.equal(textify(null), '', 'safe return, null');
    });
    it('should know how to join', () => {
      let data = ['one', 'two', 'three'];
      assert.equal(textify(data), 'one', 'no join, just first');
      assert.equal(textify(data, ', '), 'one, two, three', 'joins');
    });
    it('should handle plain strings', () => {
      assert.equal(textify('data'), 'data', 'plain works');
    });
    it('should handle @value with no stripping for non-HTML', () => {
      assert.equal(
        textify({ '@type': 'xsd:gSomething', '@value': '<em>1977-03</em>' }),
        '<em>1977-03</em>',
        'no over-stripping'
      );
    });
    it('should strip HTML', () => {
      assert.equal(
        textify({ '@type': 'rdf:HTML', '@value': '<em>1977-03</em>' }),
        '1977-03',
        'stripping'
      );
    });
    it('should de-entitise', () => {
      assert.equal(
        textify({
          '@type': 'rdf:HTML',
          '@value': '<em>this &amp; that, snowman &#9731;</em>'
        }),
        'this & that, snowman \u2603',
        'de-entitise'
      );
    });
  });

  describe('unrole', () => {
    it('should behave', () => {
      assert.equal(typeof unrole(), 'undefined', 'do not throw etc..');
    });

    it('should unrole', () => {
      const role = {
        citation: '_:id'
      };
      assert.equal(unrole(role, 'citation'), '_:id', 'unrole');
      assert.deepEqual(unrole(role), role, 'do nothing if no roleProp');
      assert.deepEqual(
        unrole(role, 'xx'),
        role,
        'do nothing if roleProp not in obj'
      );
    });

    it('should unrole when context specifies that a roleProp is a list', () => {
      const role = {
        citation: ['_:id']
      };
      assert.equal(
        unrole(role, 'citation'),
        '_:id',
        'unrole and handle @set or @list context'
      );
    });
  });

  describe('boolean', () => {
    const doc = {
      '@type': 'Dataset',
      isSupportingResource: true
    };

    it('should preserve boolean on JSON-LD transforms', async () => {
      const flattened = await flatten(doc);
      assert.equal(
        typeof flattened['@graph'][0].isSupportingResource,
        'boolean'
      );
    });
  });

  describe('nodeify', () => {
    it('should nodeify a string', () => {
      assert.deepEqual(nodeify('tmp:foo'), { '@id': 'tmp:foo' });
    });
  });
});
