/**
 * Master GRE Verbal Data Aggregator
 * Combines all chapter data modules into a single unified GRE_DATA array.
 */
(function(global) {
  'use strict';

  const allData = [
    ...(typeof GRE_CH2_DATA !== 'undefined' ? GRE_CH2_DATA : []),
    ...(typeof GRE_CH3_DATA !== 'undefined' ? GRE_CH3_DATA : []),
    ...(typeof GRE_CH4_DATA !== 'undefined' ? GRE_CH4_DATA : []),
    ...(typeof GRE_CH5_DATA !== 'undefined' ? GRE_CH5_DATA : []),
    ...(typeof GRE_CH6_DATA !== 'undefined' ? GRE_CH6_DATA : [])
  ];

  global.GRE_DATA = allData;
})(typeof window !== 'undefined' ? window : globalThis);
