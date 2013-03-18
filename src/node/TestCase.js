/*global require, module */
var Node = require( './Node' );


/**
 * @class node.TestCase
 * 
 * Represents an Ext.Test TestCase. A TestCase has a name, and may be composed of a 
 * {@link node.SetUp Setup} node, a {@link node.TearDown TearDown} node, a {@link node.Should Should}
 * block (which has information about ignored tests and tests that should error), and
 * one or more {@link node.Test Test} nodes. 
 */
var TestCaseNode = Node.extend( {
	
	/**
	 * @constructor
	 * @param {String} name The name of the Suite.
	 * @param {node.SetUp} setUp The SetUp node, if any. `null` for none.
	 * @param {node.TearDown} tearDown The TearDown node, if any. `null` for none.
	 * @param {node.Should} should The Should node, if any. `null` for none.
	 * @param {node.Test[]} tests The child tests.
	 */
	constructor : function( name, setUp, tearDown, should, tests ) {
		this.name = name;
		this.setUp = setUp;
		this.tearDown = tearDown;
		this.should = should;
		this.tests = tests;
	}
	
} );

module.exports = TestCaseNode;