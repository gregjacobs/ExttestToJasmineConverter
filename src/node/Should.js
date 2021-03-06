/*global require, module */
var AbstractNode = require( './Node' );


/**
 * @class node.Should
 * @extends node.Node
 * 
 * Represents an Ext.Test `_should` block, which holds directives for ignored tests and
 * tests that should throw an error. 
 */
var ShouldNode = AbstractNode.extend( {
	
	/**
	 * @constructor
	 * @param {Object} ignoredTests A map of ignored tests. The keys are the test names,
	 *   and the values are always `true`. (Really this is a Set more-so than a Map.)
	 * @param {Object} errorTests An map of tests that should error. The keys
	 *   are the test names, and the values are the error messages that are expected.
	 */
	constructor : function( ignoredTests, errorTests ) {
		this.ignoredTests = ignoredTests || {};
		this.errorTests = errorTests || {};
	},
	
	
	/**
	 * Retrieves the map (set) of ignored tests.
	 * 
	 * @return {Object} A map of ignored tests. The keys are the test names, and the values
	 *   are always `true`.
	 */
	getIgnoredTests : function() {
		return this.ignoredTests;
	},
	
	
	/**
	 * Retrieves the map of tests that should error. 
	 * 
	 * @return {Object} A map of tests that should error. The keys are the test names, and the
	 * values are the error messages that are expected.
	 */
	getErrorTests : function() {
		return this.errorTests;
	}
	
} );

module.exports = ShouldNode;