/* eslint-env jest, jasmine */

import {SearchParameters} from 'algoliasearch-helper';

import connect from './connectRange';
jest.mock('../core/createConnector');

const {
  getProvidedProps,
  refine,
  getSearchParameters: getSP,
  getMetadata,
  cleanUp,
} = connect;

let props;
let params;

describe('connectRange', () => {
  it('provides the correct props to the component', () => {
    props = getProvidedProps({attributeName: 'ok', min: 5, max: 10}, {}, {});
    expect(props).toEqual({
      min: 5,
      max: 10,
      currentRefinement: {min: 5, max: 10},
      count: [],
    });

    const results = {
      getFacetStats: () => ({min: 5, max: 10}),
      getFacetValues: () => [{name: '5', count: 10}, {name: '2', count: 20}],
      getFacetByName: () => true,
    };
    props = getProvidedProps({attributeName: 'ok'}, {}, {results});
    expect(props).toEqual({
      min: 5,
      max: 10,
      currentRefinement: {min: 5, max: 10},
      count: [{value: '5', count: 10}, {value: '2', count: 20}],
    });

    props = getProvidedProps({attributeName: 'ok'}, {ok: {min: 6, max: 9}}, {});
    expect(props).toBe(null);

    props = getProvidedProps({
      attributeName: 'ok',
      min: 5,
      max: 10,
    }, {
      range: {ok: {min: 6, max: 9}},
    }, {});
    expect(props).toEqual({
      min: 5,
      max: 10,
      currentRefinement: {min: 6, max: 9},
      count: [],
    });

    props = getProvidedProps({
      attributeName: 'ok',
      min: 5,
      max: 10,
    }, {
      range: {ok: {min: '6', max: '9'}},
    }, {});
    expect(props).toEqual({
      min: 5,
      max: 10,
      currentRefinement: {min: 6, max: 9},
      count: [],
    });

    props = getProvidedProps({
      attributeName: 'ok',
      min: 5,
      max: 10,
      defaultRefinement: {min: 6, max: 9},
    }, {}, {});
    expect(props).toEqual({
      min: 5,
      max: 10,
      currentRefinement: {min: 6, max: 9},
      count: [],
    });
  });

  it('calling refine updates the widget\'s search state', () => {
    const nextState = refine({attributeName: 'ok'}, {otherKey: 'val', range: {otherKey: 'val'}}, 'yep');
    expect(nextState).toEqual({
      otherKey: 'val',
      range: {ok: 'yep', otherKey: 'val'},
    });
  });

  it('refines the corresponding numeric facet', () => {
    params = getSP(
      new SearchParameters(),
      {attributeName: 'facet'},
      {range: {facet: {min: 10, max: 30}}}
    );
    expect(params.getNumericRefinements('facet')).toEqual({
      '>=': [10],
      '<=': [30],
    });
  });

  it('registers its filter in metadata', () => {
    let metadata = getMetadata(
      {attributeName: 'wot'},
      {range: {wot: {min: 5}}}
    );
    expect(metadata).toEqual({
      id: 'wot',
      items: [{
        label: '5 <= wot',
        attributeName: 'wot',
        currentRefinement: {min: 5, max: undefined},
        // Ignore clear, we test it later
        value: metadata.items[0].value,
      }],
    });

    const searchState = metadata.items[0].value({range: {wot: {min: 5}}});
    expect(searchState).toEqual({range: {wot: {}}});

    metadata = getMetadata(
      {attributeName: 'wot'},
      {range: {wot: {max: 10}}}
    );
    expect(metadata).toEqual({
      id: 'wot',
      items: [{
        label: 'wot <= 10',
        attributeName: 'wot',
        currentRefinement: {min: undefined, max: 10},
        value: metadata.items[0].value,
      }],
    });

    metadata = getMetadata(
      {attributeName: 'wot'},
      {range: {wot: {min: 5, max: 10}}}
    );
    expect(metadata).toEqual({
      id: 'wot',
      items: [{
        label: '5 <= wot <= 10',
        attributeName: 'wot',
        currentRefinement: {min: 5, max: 10},
        value: metadata.items[0].value,
      }],
    });
  });

  it('should return the right searchState when clean up', () => {
    let searchState = cleanUp({attributeName: 'name'}, {
      range: {name: 'searchState', name2: 'searchState'},
      another: {searchState: 'searchState'},
    });
    expect(searchState).toEqual({range: {name2: 'searchState'}, another: {searchState: 'searchState'}});

    searchState = cleanUp({attributeName: 'name2'}, searchState);
    expect(searchState).toEqual({another: {searchState: 'searchState'}});
  });
});
