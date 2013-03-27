/*global require, module */
var Node = require( './Node' );


/**
 * @class node.TestCase
 * @extends node.Node
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
	},
	
	
	/**
	 * Retrieves the name.
	 * 
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	
	
	/**
	 * Retrieves the Should node (if there is one).
	 * 
	 * @return {node.Should} The Should node, or null if there was no _should object.
	 */
	getShould : function() {
		return this.should;
	},
	
	
	/**
	 * Retrieves the SetUp node (if there is one).
	 * 
	 * @return {node.SetUp} The SetUp node, or null if there was no setUp() method.
	 */
	getSetUp : function() {
		return this.setUp;
	},
	
	
	/**
	 * Retrieves the TearDown node (if there is one).
	 * 
	 * @return {node.TearDown} The TearDown node, or null if there was no tearDown() method.
	 */
	getTearDown : function() {
		return this.tearDown;
	},
	
	
	/**
	 * Retrieves the Test nodes.
	 * 
	 * @return {node.Test[]} The array of Test nodes, one for each test method.
	 */
	getTests : function() {
		return this.tests || [];
	},
	
	
	/**
	 * Accepts a Visitor.
	 * 
	 * @param {node.Visitor} visitor
	 */
	accept : function( visitor ) {
		visitor.visitTestCase( this );
		
		var should = this.getShould(),
		    setUp = this.getSetUp(),
		    tearDown = this.getTearDown(),
		    tests = this.getTests();
		
		if( should ) should.accept( visitor );
		if( setUp ) setUp.accept( visitor );
		if( tearDown ) tearDown.accept( visitor );
		tests.forEach( function( test ) {
			test.accept( visitor );
		} );
	}
	
} );

module.exports = TestCaseNode;