/*global require, module */
var Node = require( './Node' );


/**
 * @class node.Should
 * @extends node.Node
 * 
 * Represents an Ext.Test `_should` block, which holds directives for ignored tests and
 * tests that should throw an error. 
 */
var ShouldNode = Node.extend( {
	
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
	},
	
	
	/**
	 * Accepts a Visitor.
	 * 
	 * @param {node.Visitor} visitor
	 */
	accept : function( visitor ) {
		visitor.visitShould( this );
	}
	
} );

module.exports = ShouldNode;