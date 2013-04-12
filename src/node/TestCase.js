/*global require, module */
var AbstractNode     = require( './Node' ),
    TestNode         = require( './Test' ),
    HelperMethodNode = require( './HelperMethod' );


/**
 * @class node.TestCase
 * @extends node.Node
 * 
 * Represents an Ext.Test TestCase. A TestCase has a name, and may be composed of a 
 * {@link node.SetUp Setup} node, a {@link node.TearDown TearDown} node, a {@link node.Should Should}
 * block (which has information about ignored tests and tests that should error), and
 * one or more {@link node.Test Test} nodes. 
 */
var TestCaseNode = AbstractNode.extend( {
	
	/**
	 * @constructor
	 * @param {String} name The name of the TestCase.
	 * @param {node.Should} should The Should node, if any. `null` for none.
	 * @param {node.SetUp} setUp The SetUp node, if any. `null` for none.
	 * @param {node.TearDown} tearDown The TearDown node, if any. `null` for none.
	 * @param {node.Test[]} tests The child tests.
	 * @param {node.HelperMethod[]} helperMethods Any helper methods that exist in the TestCase.
	 */
	constructor : function( name, should, setUp, tearDown, tests, helperMethods ) {
		tests = tests || [];
		helperMethods = helperMethods || [];
		
		// Do some checking that tests are node.Test instances, and helperMethods are node.HelperMethod instances,
		// just to make sure, and to assist in debugging
		var i, len;
		for( i = 0, len = tests.length; i < len; i++ ) {
			if( !( tests[ i ] instanceof TestNode ) ) 
				throw new Error( "An element provided to the tests array was not a node.Test instance" );
		}
		for( i = 0, len = helperMethods.length; i < len; i++ ) {
			if( !( helperMethods[ i ] instanceof HelperMethodNode ) ) 
				throw new Error( "An element provided to the helperMethods array was not a node.HelperMethod instance" );
		}
		
		this.name = name;
		this.should = should;
		this.setUp = setUp;
		this.tearDown = tearDown;
		this.tests = tests;
		this.helperMethods = helperMethods;
	},
	
	
	/**
	 * Sets the name of the TestCase.
	 * 
	 * @param {String} name
	 */
	setName : function( name ) {
		this.name = name;
	},
	
	
	/**
	 * Retrieves the name of the TestCase.
	 * 
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	
	
	/**
	 * Retrieves the Should node (if there is one).
	 * 
	 * @return {node.Should} The Should node, or `null` if there was no _should object.
	 */
	getShould : function() {
		return this.should;
	},
	
	
	/**
	 * Retrieves the SetUp node (if there is one).
	 * 
	 * @return {node.SetUp} The SetUp node, or `null` if there was no setUp() method.
	 */
	getSetUp : function() {
		return this.setUp;
	},
	
	
	/**
	 * Retrieves the TearDown node (if there is one).
	 * 
	 * @return {node.TearDown} The TearDown node, or `null` if there was no tearDown() method.
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
	 * Retrieves the HelperMethod nodes.
	 * 
	 * @return {node.HelperMethod[]} The array of HelperMethod nodes.
	 */
	getHelperMethods : function() {
		return this.helperMethods || [];
	}
	
} );

module.exports = TestCaseNode;